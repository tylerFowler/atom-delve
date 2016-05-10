'use babel';

import SourceView              from './views/source.js';
import DelveServerMgr          from './delve-server-mgr';
import Config                  from './config';
import { DelveConnMgr }        from './delve-client';
import { CompositeDisposable } from 'atom';

function _getActiveProjectRoot() {
  let editor = atom.workspace.getActiveTextEditor();
  let paths = atom.workspace.project.relativizePath(editor.getDirectoryPath());

  return paths[0];
}

export default {
  subscriptions: null,
  sessionSubscriptions: null,
  serverMgr: null,
  buildFlags: null,
  sourceView: null,
  config: require('./config.json'),

  activate() {
    global.__atomDelve = this; // NOTE: Definitely remove this for release
    this.serverMgr = new DelveServerMgr();

    // overridable settings
    this.buildFlags = Config.buildFlags;

    this.subscriptions = new CompositeDisposable();
    this.sessionSubscriptions = new CompositeDisposable();

    // commands
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:toggle', () =>
        this.startSession('debug', _getActiveProjectRoot())
    ));

    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:kill', () => {
        if (this.serverMgr && this.serverMgr._pid) {
          let pid = this.serverMgr._pid;
          this.stopSession();
          atom.notifications.addInfo(`Killed Delve server with pid ${pid}`);
        }
      }
    ));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.buildFlags = null;
    Config.dispose();

    this.stopSession();
  },

  stopSession() {
    this.sessionSubscriptions.dispose();

    if (this.sourceView) this.sourceView.destroy();
    if (this.serverMgr) this.serverMgr.endSession();
    if (this.client) DelveConnMgr.endConnection();
  },

  initViews() {
    let sourceView = new SourceView();
    this.sourceView = sourceView;
    this.sessionSubscriptions.add(sourceView);
  },

  startSession(sessionType, debugPath) {
    if (!this.serverMgr || this.serverMgr.hasSessionStarted) return;

    switch (sessionType) {
    case 'debug':
      this.serverMgr.startDebugSession(debugPath, this.buildFlags); break;
    case 'test':
      this.serverMgr.startTestingSession(debugPath, this.buildFlags); break;
    default:
      return atom.notifications.addError(
        `atom-delve: Invalid session type ${sessionType}`
      );
    }

    this.serverMgr.on('serverStart', (host, port) => {
      console.debug(`Started Delve server at ${debugPath}`);
      DelveConnMgr.connect(host, port)
      .then(() => {
        console.debug(`Connected to Delve server at ${host}:${port}`);
        this.initViews();
        atom.notifications.addInfo('Started Delve session');
      })
      .catch(err => {
        atom.notifications.addError('Could not connect to Delve server', {
          detail: err.toString(), dismissable: true
        });
        console.error('Could not connect to Delve server: ', err);

        this.stopSession();
      });
    });

    this.serverMgr.on('error', msg => atom.notifications
    .addError('Delve Error', { detail: msg, dismissable: true }));

    this.serverMgr.on('fatal', err => {
      atom.notifications
      .addError('Received a fatal error from the Delve server process, closing',
        { detail: err.toString(), dismissable: true }
      );

      this.stopSession();
    });
  }
};

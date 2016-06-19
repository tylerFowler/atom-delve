'use babel';

import DelveServerMgr          from './delve-server-mgr';
import Config                  from './config';
import SourceView              from './views/source';
import ToolbarView             from './views/toolbar';
import DelveIOPanel            from './views/ioPanel';
import { DelveConnMgr }        from './delve-client';
import AtomDelveCommands       from './atom-commands';
import { CompositeDisposable } from 'atom';
import { StoreManager }        from './stores';

export default {
  subscriptions: null,
  sessionSubscriptions: null,
  commandMgr: null,
  serverMgr: null,
  buildFlags: null,
  sourceView: null,
  toolbarView: null,
  ioPanel: null,
  config: require('./config.json'),

  activate() {
    // TODO: download & install delve for user if they don't have it?
    global.__atomDelve = this; // NOTE: Definitely remove this for release
    this.serverMgr = new DelveServerMgr();

    // overridable settings
    this.buildFlags = Config.buildFlags;

    this.subscriptions = new CompositeDisposable();
    this.sessionSubscriptions = new CompositeDisposable();
    this.commandMgr = new AtomDelveCommands(this);
  },

  deactivate() {
    this.subscriptions.dispose();
    this.commandMgr.dispose();
    this.buildFlags = null;
    Config.dispose();

    this.stopSession();
  },

  stopSession() {
    this.sessionSubscriptions.dispose();

    if (this.ioPanel) this.ioPanel.destroy();
    if (this.toolbarView) this.toolbarView.destroy();
    if (this.sourceView) this.sourceView.destroy();
    if (this.serverMgr) this.serverMgr.endSession();
    if (this.client) DelveConnMgr.endConnection();

    this.ioPanel = null;
    this.toolbarView = null;
    this.sourceView = null;

    StoreManager.resetStores();
  },

  initViews() {
    let sourceView = new SourceView();
    this.sourceView = sourceView;
    this.sessionSubscriptions.add(sourceView);

    this.toolbarView = new ToolbarView(() => this.stopSession());

    this.ioPanel = new DelveIOPanel({
      emitter: this.serverMgr,
      stdoutEvt: 'runtimeStdout',
      stderrEvt: 'runtimeStderr'
    });
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
        atom.notifications.addError('Error starting Delve session', {
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

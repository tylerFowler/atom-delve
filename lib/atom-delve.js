'use babel';

import SourceView              from './components/source.js';
import DelveServerMgr          from './delve-server-mgr';
import Config                  from './config';
import { DelveConnMgr }        from './delve-client';
import { CompositeDisposable } from 'atom';

export default {
  atomDelveView: null,
  modalPanel: null,
  subscriptions: null,
  serverMgr: null,
  buildFlags: null,

  activate() {
    this.serverMgr = new DelveServerMgr();

    // overridable settings
    this.buildFlags = Config.buildFlags;

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomDelveView.getElement(),
      visible: false
    });

    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.sourceView.destroy();
    this.buildFlags = null;

    this.stopSession();
  },

  stopSession() {
    if (this.serverMgr) this.serverMgr.endSession();
    if (this.client) DelveConnMgr.endConnection();

    this.serverMgr = null;
  },

  initViews() {
    this.sourceView = new SourceView();
  },

  startSession(sessionType, debugPath) {
    if (this.serverMgr.hasSessionStarted) return;

    switch (sessionType) {
    case 'debug':
      this.serverMgr.startDebugSession(debugPath, this.buildFlags); break;
    case 'test':
      this.serverMgr.startTestingSession(debugPath, this.buildFlags); break;
    default:
      return atom.notifications.addFatalError(
        `Invalid session type ${sessionType}`
      );
    }

    this.serverMgr.on('startServer', (host, port) => {
      console.debug(`Started Delve server at ${debugPath}`);
      DelveConnMgr.connect()
      .then(() => {
        console.debug(`Connected to Delve server at ${host}:${port}`);
        this.initViews();
      })
      .catch(err => {
        atom.notifications.addFatalError('Could not connect to Delve server', {
          detail: err.toString(), dismissable: true
        });

        this.stopSession();
      });
    });

    this.serverMgr.on('error', err => {
      atom.notifications
      .addFatalError('Received an error from the Delve server process', {
        detail: err.toString(), dismissable: true
      });

      this.stopSession();
    });
  }
};

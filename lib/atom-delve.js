'use babel';

import AtomDelveView           from './atom-delve-view';
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

  activate(state) {
    this.serverMgr = new DelveServerMgr();

    // overridable settings
    this.buildFlags = Config.buildFlags;

    this.atomDelveView = new AtomDelveView(state.atomDelveViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomDelveView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up
    // with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomDelveView.destroy();
    this.buildFlags = null;

    this.stopSession();
  },

  serialize() {
    return {
      atomDelveViewState: this.atomDelveView.serialize()
    };
  },

  stopSession() {
    if (this.serverMgr) this.serverMgr.endSession();
    if (this.client) DelveConnMgr.endConnection();

    this.serverMgr = null;
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
        // TODO: trigger start of the React app & dispatcher
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

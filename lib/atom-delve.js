'use babel';

const DelveClient = require('delvejs');

import AtomDelveView from './views/atom-delve-view';
import DelveServerMgr from './services/delve-server-mgr';
import Config from './config';
import { CompositeDisposable } from 'atom';

export default {
  atomDelveView: null,
  modalPanel: null,
  subscriptions: null,
  serverMgr: null,
  buildFlags: null,
  client: null,

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
  },

  serialize() {
    return {
      atomDelveViewState: this.atomDelveView.serialize()
    };
  }
};

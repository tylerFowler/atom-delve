'use babel';

import AtomDelveView from './atom-delve-view';
import { CompositeDisposable } from 'atom';

export default {
  atomDelveView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
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

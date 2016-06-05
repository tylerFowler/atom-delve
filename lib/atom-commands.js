'use babel';

import { CompositeDisposable } from 'atom';

function _getActiveProjectRoot() {
  let editor = atom.workspace.getActiveTextEditor();
  let paths = atom.workspace.project.relativizePath(editor.getDirectoryPath());

  return paths[0];
}

export default class AtomDelveCommands {
  constructor(atomDelve) {
    this.subscriptions = new CompositeDisposable();
    this.atomDelve = atomDelve;

    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:toggle', () =>
        this.atomDelve.startSession('debug', _getActiveProjectRoot())
    ));

    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:kill', () => {
        if (this.atomDelve.serverMgr && this.atomDelve.serverMgr._pid) {
          let pid = this.atomDelve.serverMgr._pid;
          this.atomDelve.stopSession();
          atom.notifications.addInfo(`Killed Delve server with pid ${pid}`);
        }
      }
    ));
  }

  dispose() {
    this.subscriptions.dispose();
  }
}

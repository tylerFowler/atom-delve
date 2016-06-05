'use babel';

import { CompositeDisposable } from 'atom';
import { DebuggerActions, BreakpointActions } from './actions';

function _getActiveProjectRoot() {
  let editor = atom.workspace.getActiveTextEditor();
  let paths = atom.workspace.project.relativizePath(editor.getDirectoryPath());

  return paths[0];
}

export default class AtomDelveCommands {
  constructor(atomDelve) {
    this.subscriptions = new CompositeDisposable();
    this.atomDelve = atomDelve;

    // Start New Debug Session
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:start-debugger', () =>
        this.atomDelve.startSession('debug', _getActiveProjectRoot())
    ));

    // Kill Debugger & End Session
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:kill', () => {
        if (this.atomDelve.serverMgr && this.atomDelve.serverMgr._pid) {
          let pid = this.atomDelve.serverMgr._pid;
          this.atomDelve.stopSession();
          atom.notifications.addInfo(`Killed Delve server with pid ${pid}`);
        }
      }
    ));

    // Restart Process
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:restart-process', () =>
        DebuggerActions.restartProcess()
    ));

    // Continue Debugger
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:continue', () =>
        DebuggerActions.continueToBreakpoint()
    ));

    // Next in source
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:next', () =>
        DebuggerActions.nextInScope()
    ));

    // Step Debugger
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:step', () =>
        DebuggerActions.step()
    ));

    // Step Instruction
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:step-instruction', () =>
        DebuggerActions.stepInstruction()
    ));

    // Clear Breakpoints
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', 'atom-delve:clear-breakpoints', () =>
        BreakpointActions.clearAllBreakpoints()
    ));
  }

  dispose() {
    this.subscriptions.dispose();
  }
}

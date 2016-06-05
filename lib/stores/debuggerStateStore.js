'use babel';
/**
  DebuggerStateStore
  @description keeps track of current state of the Delve remote debugger,
    synchronizing our state with the debugger state
**/

import { ReduceStore } from 'flux/utils';
import Constants       from '../constants/debuggerStateConstants';

const makeBlankState = () => ({
  currentThread: null,
  currentGoroutine: null,
  threads: [],
  exited: false,
  exitStatus: null
});

export default class DebuggerStateStore extends ReduceStore {
  constructor(dispatcher) {
    super(dispatcher);
  }

  resetState() {
    this._state = this.getInitialState();
  }

  getInitialState() { return makeBlankState(); }

  reduce(state, action) {
    switch (action.type) {
    case Constants.DEBUGGER_CONTINUE:
      return action.debuggerState;

    case Constants.DEBUGGER_EXITED:
      if (action.exitStatus === 0)
        atom.notifications.addInfo('Delve: Process exited normally');
      else
        atom.notifications.addError(
          `Delve: Process exited with status ${action.exitStatus}`,
          { dismissable: true }
        );

      return makeBlankState();

    case Constants.DEBUGGER_UNKOWN_ERROR:
      atom.notifications.addError(
        'Delve encountered an error',
        { dismissable: true, detail: action.error.toString() }
      );

      return makeBlankState();

    default:
      return state;
    }
  }

  getScope() {
    if (this._state.currentThread === null) return null;
    return {
      file: this._state.currentThread.file,
      line: this._state.currentThread.line
    };
  }

  getLocals() {
    if (!this._state.currentThread) return [];
    return this._state.currentThread.function.locals;
  }

  getArgs() {
    if (!this._state.currentThread) return [];
    return this._state.currentThread.function.args;
  }

  getThreads() {
    return this._state.threads;
  }
}

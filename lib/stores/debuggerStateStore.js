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
  exitStatus: null,
  stacktrace: null
});

export default class DebuggerStateStore extends ReduceStore {
  constructor(dispatcher) {
    super(dispatcher);
  }

  resetState() {
    this._state = this.getInitialState();
  }

  getInitialState() {
    return { debuggerState: makeBlankState(), stacktrace: null };
  }

  reduce(state, action) {
    switch (action.type) {
    case Constants.DEBUGGER_CONTINUE:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace
      };

    case Constants.DEBUGGER_NEXT:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace
      };

    case Constants.DEBUGGER_NEXT_FAILURE:
      atom.notifications.addError(
        'Delve: Could not go to next source line',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_STEP:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace
      };

    case Constants.DEBUGGER_STEP_FAILURE:
      atom.notifications.addError(
        'Delve: Could not step through',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_STEP_INSTR:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace
      };

    case Constants.DEBUGGER_STEP_INSTR_FAILURE:
      atom.notifications.addError(
        'Delve: Could not step instruction',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_RESTART:
      atom.notifications.addInfo('Delve: restarted process');
      return {
        debuggerState: action.debuggerState, stacktrace: null
      };

    case Constants.DEBUGGER_RESTART_FAILURE:
      atom.notifications.addError(
        'Delve: Could not restart process',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_EXITED:
      if (action.exitStatus == 0)
        atom.notifications.addInfo('Delve: Process exited normally');
      else
        atom.notifications.addError(
          `Delve: Process exited with status ${action.exitStatus}`
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

    return state;
  }

  getScope() {
    const thread = this._state.debuggerState.currentThread;
    if (thread === null) return null;
    return {
      file: thread.file,
      line: thread.line
    };
  }

  getEvalScope() {
    const curThread = this._state.debuggerState.currentThread;
    if (curThread === null) return { goroutineId: -1, frameId: 0 };
    return {
      goroutineId: curThread.goroutineID || -1,
      frameId: 0 // TODO: set to 0 until we figure out where to get it
    };
  }

  getLocals() {
    if (!this._state.debuggerState.currentThread) return [];
    return this._state.debuggerState.currentThread.function.locals;
  }

  getArgs() {
    if (!this._state.debuggerState.currentThread) return [];
    return this._state.debuggerState.currentThread.function.args;
  }

  getThreads() {
    return this._state.debuggerState.threads;
  }

  getState() {
    return this._state.debuggerState;
  }

  getStacktrace() {
    return this._state.stacktrace;
  }
}

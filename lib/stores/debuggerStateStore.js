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

  getInitialState() {
    return {
      debuggerState: makeBlankState(), stacktrace: null, goroutines: []
    };
  }

  reduce(state, action) {
    switch (action.type) {
    case Constants.DEBUGGER_CONTINUE:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace,
        goroutines: action.goroutines
      };

    case Constants.DEBUGGER_NEXT:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace,
        goroutines: action.goroutines
      };

    case Constants.DEBUGGER_NEXT_FAILURE:
      atom.notifications.addError(
        'Delve: Could not go to next source line',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_STEP:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace,
        goroutines: action.goroutines
      };

    case Constants.DEBUGGER_STEP_FAILURE:
      atom.notifications.addError(
        'Delve: Could not step through',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_STEP_INSTR:
      return {
        debuggerState: action.debuggerState, stacktrace: action.stacktrace,
        goroutines: action.goroutines
      };

    case Constants.DEBUGGER_STEP_INSTR_FAILURE:
      atom.notifications.addError(
        'Delve: Could not step instruction',
        { dismissable: true, detail: action.error.toString() }
      ); break;

    case Constants.DEBUGGER_RESTART:
      atom.notifications.addInfo('Delve: restarted process');
      return {
        debuggerState: action.debuggerState, stacktrace: null, goroutines: []
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

      return this.getInitialState();

    case Constants.DEBUGGER_UNKOWN_ERROR:
      atom.notifications.addError(
        'Delve encountered an error',
        { dismissable: true, detail: action.error.toString() }
      );

      return this.getInitialState();

    default:
      return state;
    }

    return state;
  }

  getScope() {
    const thread = this.getState().currentThread;
    if (thread === null) return null;
    return {
      file: thread.file,
      line: thread.line
    };
  }

  getEvalScope() {
    const curThread = this.getState().currentThread;
    if (curThread === null) return { goroutineId: -1, frameId: 0 };
    return {
      goroutineId: curThread.goroutineID || -1,
      frameId: 0 // TODO: set to 0 until we figure out where to get it
    };
  }

  getLocals() {
    if (!this.getState().currentThread) return [];
    return this.getState().currentThread.function.locals;
  }

  getArgs() {
    if (!this.getState().currentThread) return [];
    return this.getState().currentThread.function.args;
  }

  // TODO: implement a getVars method that gets all of the locals AND
  // arguments (and if applicable any vars in scope that are not 'local')

  getThreads() {
    if (!this.getState() || !this.getState().threads) return [];

    const curId = this.getState().currentThread
      ? this.getState().currentThread.id
      : -1;

    return this.getState().threads.map(t => {
      t.active = t.id === curId;
      return t;
    });
  }

  getGoroutines() {
    const curId = this.getState().currentGoroutine
      ? this.getState().currentGoroutine.id
      : -1;

    return this._state.goroutines.map(g => {
      g.active = g.id === curId;
      return g;
    });
  }

  getState() {
    return this._state.debuggerState;
  }

  getStacktrace() {
    if (!this._state.stacktrace || !this.getState().currentThread) return [];

    const curPC = this.getState().currentThread.pc;
    return this._state.stacktrace.map(st => {
      st.active = st.pc === curPC;
      return st;
    });
  }
}

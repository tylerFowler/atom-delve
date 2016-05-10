'use babel';
/**
  DebuggerStateStore
  @description keeps track of current state of the Delve remote debugger,
    synchronizing our state with the debugger state
**/

/* eslint no-unused-vars:0 */
import { ReduceStore } from 'flux/utils';
import DelveDispatcher from '../dispatcher/DelveDispatcher';
import Constants       from '../constants/debuggerStateConstants';

class DebuggerStateStore extends ReduceStore {
  getInitialState() {
    return {
      currentThread: null,
      currentGoroutine: null,
      threads: [],
      exited: false,
      exitStatus: null
    };
  }

  reduce(state, action) {
    switch (action.type) {
    default: return state;
    }
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

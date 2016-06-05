'use babel';

import DelveDispatcher from '../dispatcher/delveDispatcher';

import BreakpointStore    from './breakpointStore';
import DebuggerStateStore from './debuggerStateStore';

const bpStore = new BreakpointStore(DelveDispatcher);
const stateStore = new DebuggerStateStore(DelveDispatcher);

class StoreManager {
  constructor() {
    this.bpStore = bpStore;
    this.stateStore = stateStore;
  }

  resetStores() {
    this.bpStore.resetState();
    this.stateStore.resetState();
  }
}

const storeMgr = new StoreManager();

export {
  bpStore as BreakpointStore,
  stateStore as DebuggerStateStore,
  storeMgr as StoreManager
};

'use babel';

import DelveDispatcher from '../dispatcher/delveDispatcher';

import BreakpointStore    from './breakpointStore';
import DebuggerStateStore from './debuggerStateStore';

const bpStore = new BreakpointStore(DelveDispatcher);
const stateStore = new DebuggerStateStore(DelveDispatcher);

export {
  bpStore as BreakpointStore,
  stateStore as DebuggerStateStore
};

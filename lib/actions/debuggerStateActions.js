'use babel';

import { Delve }  from '../delve-client';
import Dispatcher from '../dispatcher/delveDispatcher';
import Constants  from '../constants/debuggerStateConstants';

export default {
  /**
    @name State#continueToBreakpoint
    @desc continues execution until the next breakpoint or the process exits
    @emits DEBUGGER_CONTINUE({debuggerState})
    @emits DEBUGGER_EXITED({exitStatus})
    @emits DEBUGGER_UNKOWN_ERROR({error})
  **/
  continueToBreakpoint() {
    Delve.continueToNextBreakpoint()
    .then(newState =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_CONTINUE,
        debuggerState: newState
      })
    // for some reason we can't seem to use DelveError.DebuggerExited
    ).catch({ name: 'DelveErrorDebuggerExited' }, err =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_EXITED,
        exitStatus: err.exitStatus
      })
    ).catch(error =>
      Dispatcher.dispatch({type: Constants.DEBUGGER_UNKOWN_ERROR, error })
    );
  }
};

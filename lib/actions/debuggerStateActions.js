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
  },

  /**
    @name State#restartProcess
    @desc restarts the process, updating the debugger state
    @emits DEBUGGER_RESTART({debuggerState})
    @emits DEBUGGER_RESTART_FAILURE({error})
  **/
  restartProcess() {
    Delve.restartProcess()
    .then(newState =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_RESTART,
        debuggerState: newState
      })
    ).catch(error =>
      Dispatcher.dispatch({ type: Constants.DEBUGGER_RESTART_FAILURE, error })
    );
  },

  /**
    @name State#nextInScope
    @desc moves debugger to the next line in the scope
    @emits DEBUGGER_NEXT({debuggerState})
    @emits DEBUGGER_EXITED({exitStatus})
    @emits DEBUGGER_NEXT_FAILURE({error})

    TODO: on exit we still get a "unhandled Promise rejection" error
  **/
  nextInScope() {
    Delve.next()
    .then(newState =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_NEXT,
        debuggerState: newState
      })
    ).catch({ name: 'DelveErrorDebuggerExited' }, err =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_EXITED,
        exitStatus: err.exitStatus
      })
    ).catch(error =>
      Dispatcher.dispatch({ type: Constants.DEBUGGER_NEXT_FAILURE, error })
    );
  },


  /**
    @name State#step
    @desc steps debugger into next call
    @emits DEBUGGER_STEP({debuggerState})
    @emits DEBUGGER_EXITED({exitStatus})
    @emits DEBUGGER_STEP_FAILURE({error})
  **/
  step() {
    Delve.step()
    .then(newState =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_STEP,
        debuggerState: newState
      })
    ).catch({ name: 'DelveErrorDebuggerExited' }, err =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_EXITED,
        exitStatus: err.exitStatus
      })
    ).catch(error =>
      Dispatcher.dispatch({ type: Constants.DEBUGGER_STEP_FAILURE, error })
    );
  },


  /**
    @name State#stepInstruction
    @desc steps debugger into next call instruction
    @emits DEBUGGER_STEP_INSTR({debuggerState})
    @emits DEBUGGER_EXITED({exitStatus})
    @emits DEBUGGER_STEP_INSTR_FAILURE({error})
  **/
  stepInstruction() {
    Delve.stepInstruction()
    .then(newState =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_STEP_INSTR,
        debuggerState: newState
      })
    ).catch({ name: 'DelveErrorDebuggerExited' }, err =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_EXITED,
        exitStatus: err.exitStatus
      })
    ).catch(error =>
      Dispatcher.dispatch({type: Constants.DEBUGGER_STEP_INSTR_FAILURE, error})
    );
  }
};

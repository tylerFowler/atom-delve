'use babel';

import Promise    from 'bluebird';
import { Delve }  from '../delve-client';
import Dispatcher from '../dispatcher/delveDispatcher';
import Constants  from '../constants/debuggerStateConstants';
import { DebuggerStateStore as StateStore } from '../stores';

export default {
  /**
    @private
    @name State#_getStracktrace
    @desc gets the current stacktrace if the goroutine is valid
    @param {Goroutine} goroutine
    @returns Promise<Stacktrace|null>

    TODO: make the trace depth a config variable
  **/
  _getStacktrace(goroutine) {
    if (goroutine) return Delve.stacktrace(goroutine.id, 20, true);
    return Promise.resolve();
  },

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
      this._getStacktrace(newState.currentGoroutine)
      .then(stacktrace =>
        Dispatcher.dispatch({
          type: Constants.DEBUGGER_CONTINUE,
          debuggerState: newState,
          stacktrace
        })
      )
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
      this._getStacktrace(newState.currentGoroutine)
      .then(stacktrace =>
        Dispatcher.dispatch({
          type: Constants.DEBUGGER_NEXT,
          debuggerState: newState,
          stacktrace
        })
      )
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
      this._getStacktrace(newState.currentGoroutine)
      .then(stacktrace =>
        Dispatcher.dispatch({
          type: Constants.DEBUGGER_STEP,
          debuggerState: newState,
          stacktrace
        })
      )
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
      this._getStacktrace(newState.currentGoroutine)
      .then(stacktrace =>
        Dispatcher.dispatch({
          type: Constants.DEBUGGER_STEP_INSTR,
          debuggerState: newState,
          stacktrace
        })
      )
    ).catch({ name: 'DelveErrorDebuggerExited' }, err =>
      Dispatcher.dispatch({
        type: Constants.DEBUGGER_EXITED,
        exitStatus: err.exitStatus
      })
    ).catch(error =>
      Dispatcher.dispatch({type: Constants.DEBUGGER_STEP_INSTR_FAILURE, error})
    );
  },

  /**
    @name State#evalExpr
    @desc sends an expression to be evaluated in the current scope, or if either
      '=' or ':=' is found in the expression, will set a symbol to value
      Note that this emits nothing and is to be dealt with directly
    @param {string} expr
    @returns Promise<resultVar|null>

    TODO: should probably return the updated state & stacktrace after this
  **/
  evalExpr(expr) {
    let promise;
    const scope = StateStore.getEvalScope();
    if (!scope) return Promise.reject(new Error('Invalid scope'));

    // if we have a `=` or `:=` then we want to set a symbol
    const assignmentRegex = /[\:]{0,1}={1}/;
    if (expr.match(assignmentRegex)) {
      const [ sym, val ] = expr.split(assignmentRegex).map(s => s.trim());
      promise = Delve.setSymbol(sym, val, scope.goroutineId, scope.frameId);
    } else promise = Delve.evalSymbol(expr, scope.goroutineId, scope.frameId);

    return promise;
  }
};

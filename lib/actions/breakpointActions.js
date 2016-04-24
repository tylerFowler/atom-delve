'use babel';

import {Delve}    from '../delve-client';
import Dispatcher from '../dispatcher/delveDispatcher';
import Constants  from '../constants/breakpointConstants';
import BreakpointStore from '../stores/breakpointStore';

export default {
  /**
    @name Breakpoint#create
    @desc creates a new breakpoint at "file:line"
    @param {string} _name :default => the next available breakpoint index
    @param {string} file
    @param {number} line
    @emits BREAKPOINT_CREATE_REQUEST({name, location})
    @emits BREAKPOINT_CREATE_SUCCESS({breakpoint})
    @emits BREAKPOINT_CREATE_FAILURE({error, name})
  **/
  create: function createBreakpoint(_name, file, line) {
    let name = _name || BreakpointStore.getNextBreakpointName();
    Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CREATE_REQUEST, name,
      location: { file, line }
    });
    Delve.createBreakpoints(name, `${file}:${line}`)
    .then(bps => {
      // giving a specific file:line location will ever only result in one
      // breakpoint being made
      let bp = bps[0];
      Dispatcher.dispatch({ type: Constants.BREAKPOINT_CREATE_SUCCESS, bp });
    })
    .catch(error => {
      Dispatcher.dispatch({
        type: Constants.BREAKPOINT_CREATE_FAILURE, error, name
      });
    });
  },

  setCondition: function setCondition(id, condition) {
    Dispatcher.dispatch({ type: Constants.BREAKPOINT_SET_COND_REQUEST, id });

    Delve.setBreakpiontCondition(id, condition)
    .then(() => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_SET_COND_SUCCESSFUL, id, condition
    }))
    .catch(error => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_SET_COND_FAILURE, id, error
    }));
  }
};

'use babel';

import {Delve}    from '../delve-client';
import Dispatcher from '../dispatcher/delveDispatcher';
import Constants  from '../constants/breakpointConstants';
import BreakpointStore from '../stores/breakpointStore';

export default {
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
      Dispatcher.dispatch({ type: Constants.BREAKPOINT_CREATE_FAILURE, error });
    });
  }
};

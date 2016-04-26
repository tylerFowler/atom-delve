'use babel';

const Promise = require('bluebird');

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
    @emits BREAKPOINT_CREATE_SUCCESS({created})
    @emits BREAKPOINT_CREATE_FAILURE({error, name})
  **/
  create: function create(_name, file, line) {
    let name = _name || BreakpointStore.getNextBreakpointName();
    Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CREATE_REQUEST, name,
      location: { file, line }
    });

    // Atom rows are 0 indexed whereas Delve rows are 1 indexed
    let locPattn = `${file}:${line + 1}`;

    Delve.createBreakpoints(name, locPattn)
    .then(bps => {
      // giving a specific file:line location will ever only result in one
      // breakpoint being made
      let bp = bps[0];
      Dispatcher.dispatch({
        type: Constants.BREAKPOINT_CREATE_SUCCESS, created: bp
      });
    })
    .catch(error => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CREATE_FAILURE, error, name
    }));
  },

  /**
    @name Breakpoint#creaetFromPattern
    @desc creates new breakpoints from the given pattern, note the plural
    @param {string} pattern
    @emits BREAKPOINT_CREATE_REQUEST({name, location})
    @emits BREAKPOINT_CREATE_SUCCESS({created})
    @emits BREAKPOINT_CREATE_FAILURE({error, expectingMult})
  **/
  createFromPattern: function createFromPattern(pattern) {
    // TODO: will use this bit in command for naming an existing breakpoint:
    // pattern.replace(/(?!\:)[0-9].+/, match => parseInt(match, 10) + 1);

    Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CREATE_REQUEST, name: null, location: null
    });

    Delve.createBreakpoints(null, pattern)
    .then(bps => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CREATE_SUCCESS, created: bps
    }))
    .catch(error => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CREATE_FAILURE, error, expectingMult: true
    }));
  },

  /**
    @name Breakpoint#setCondition
    @desc sets the condition for an existing breakpoint
    @param {number} bpId
    @param {string} condition => any Go boolean expression
    @emits BREAKPOINT_SET_COND_REQUEST({bpId})
    @emits BREAKPOINT_SET_COND_SUCCESS({bpId, condition})
    @emits BREAKPOINT_SET_COND_FAILURE({bpId, error})
  **/
  setCondition: function setCondition(bpId, condition) {
    Dispatcher.dispatch({ type: Constants.BREAKPOINT_SET_COND_REQUEST, bpId });

    Delve.setBreakpiontCondition(bpId, condition)
    .then(() => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_SET_COND_SUCCESSFUL, bpId, condition
    }))
    .catch(error => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_SET_COND_FAILURE, bpId, error
    }));
  },

  /**
    @name Breakpoint#clearBreakpoint
    @desc clears the breakpoint with the given ID
    @param {number} bpId
    @emits BREAKPOINT_CLEAR_REQUEST({bpId})
    @emits BREAKPOINT_CLEAR_SUCCESS({bpId})
    @emits BREAKPOINT_CLEAR_FAILURE({bpId, error})
  **/
  clearBreakpoint: function clearBreakpoint(bpId) {
    Dispatcher.dispatch({ type: Constants.BREAKPOINT_CLEAR_REQUEST, bpId });

    Delve.clearBreakpointById(bpId)
    .then(() => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CLEAR_SUCCESS, bpId
    }))
    .catch(error => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CLEAR_FAILURE, bpId, error
    }));
  },

  /**
    @name Breakpiont#clearAllBreakpoints
    @desc clears all non-pending breakpoints known by the BreakpointStore
    @emits BREAKPOINT_CLEAR_ALL_REQUEST
    @emits BREAKPOINT_CLEAR_ALL_SUCCESS
    @emits BREAKPOINT_CLEAR_ALL_FAILURE({error})
  **/
  clearAllBreakpoints: function clearAllBreakpoints() {
    Dispatcher.dispatch({ type: Constants.BREAKPOINT_CLEAR_ALL_REQUEST });

    let promises = BreakpointStore.getBreakpoints()
    .filter(bp => !bp.pendingChange)
    .map(bp => Delve.clearBreakpointById(bp.id));

    Promise.all(promises)
    .then(() => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CLEAR_ALL_SUCCESS
    }))
    .catch(error => Dispatcher.dispatch({
      type: Constants.BREAKPOINT_CLEAR_ALL_FAILURE, error
    }));
  }
};

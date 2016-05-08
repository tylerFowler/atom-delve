'use babel';
/**
  BreakpointStore
  @description stores information about current breakpoints and provides
    actions to create & clear breakpoints
**/

const Store = require('flux/utils').Store;
import DelveDispatcher from '../dispatcher/delveDispatcher';
import Constants from '../constants/breakpointConstants';

let _breakpoints = [];

/**
  @name BreakpointStore#makePending
  @desc signal that the breakpoint w/ the given id has a pending change
  @param {number} id
**/
function makePending(id) {
  let bp = _breakpoints.find(b => b.id === id);
  bp.pendingChange = true;
}

/**
  @name BreakpointStore#addBreakpoints
  @desc adds the given breakpoints to the list
  @param {error} err => if present removes the pending breakpoint
  @param {object} bp => the breakpoint in the format defined by Delvejs
**/
function addBreakpoints(err, bp) {
  // if we have more than one breakpoint just push them all since we won't
  // have added any pending ones
  if (Array.isArray(bp) && bp.length > 1) {
    if (err) return atom.notifications.addError('Error adding breakpoints', {
      detail: err.toString(), dismissable: true
    });

    return _breakpoints
    .push(bp.map(b => { b.pendingChange = false; return b; }));
  }

  let idx = _breakpoints.findIndex(b => b.id < 0 && b.name === bp.name);

  if (err) {
    if (idx >= 0) _breakpoints.splice(idx, 1);
    return atom.notifications.addError('Error adding breakpoint', {
      detail: err.toString(), dismissable: true
    });
  }

  bp.pendingChange = false;
  if (idx >= 0) _breakpoints[idx] = bp;
  else _breakpoints.push(bp);
}

/**
  @name BreakpointStore#addPending
  @desc adds a pending breakpoint to the list
  @param {string} name
  @param {object} location => if null this is a noop
  @param {string} location.file
  @param {number} location.line
**/
function addPending(name, location) {
  // don't add anything if we don't know where the added breakpoint(s) will be,
  // i.e. in the case of adding by pattern where we don't know how many will
  // be added or where, if any at all
  if (location === null) return;
  _breakpoints.push({id: -1, name, location, pendingChange: true});
}

/**
  @name BreakpointStore#updateBreakpoint
  @desc updates the breakpoint w/ the given id w/ the given prop changes
  @param {error} err
  @param {number} id
  @param {object} updatedProps
**/
function updateBreakpoint(err, id, updatedProps) {
  let bp = _breakpoints.find(b => b.id === id);
  bp.pendingChange = false;

  if (err)
    return atom.notifications.addError('Error setting breakpoint condition', {
      detail: err.toString(), dismissable: true
    });

  bp = Object.assign(bp, updatedProps);
}

/**
  @name BreakpointStore#clearBreakpoint
  @desc removes the breakpoint from the list
  @param {error} err => removes even if there's an error
  @param {number} id
**/
function clearBreakpoint(err, id) {
  let idx = _breakpoints.findIndex(b => b.id === id);
  if (idx < 0) return;

  if (err) console.debug(
      `Received error deleting breakpoint ${id}, assuming destroyed`, err
    );

  _breakpoints.slice(idx, 1);
}

/**
  @name BreakpointStore#clearAllBreakpoints
  @desc clears all non-pending breakpoints
  @param {error} err => does *not* remove on error
**/
function clearAllBreakpoints(err) {
  if (err) return atom.notifications.addError('Error clearing all breakpoints',
    { detail: err.toString(), dismissable: true }
  );

  let pending = _breakpoints.filter(bp => bp.pendingChange);
  _breakpoints = [].concat(pending);
}

class BreakpointStore extends Store {
  constructor(dispatcher) {
    super(dispatcher);
  }

  getBreakpoints() {
    return _breakpoints;
  }

  getBreakpointsForFile(file) {
    return _breakpoints.filter(bp => bp.location.file === file);
  }

  getBreakpointById(id) {
    return _breakpoints.find(bp => bp.id === id);
  }

  getNextBreakpointName() {
    return _breakpoints.length;
  }

  __onDispatch(payload) {
    switch (payload.type) {
    case Constants.BREAKPOINT_CREATE_REQUEST:
      addPending(payload.name, payload.location);
      break;
    case Constants.BREAKPOINT_CREATE_SUCCESS:
      addBreakpoints(null, payload.created);
      break;
    case Constants.BREAKPOINT_CREATE_FAILURE:
      let failedBpData;
      if (payload.expectingMult) failedBpData = [{}, {}];
      else failedBpData = { name: payload.name };

      addBreakpoints(payload.error, failedBpData);
      break;

    case Constants.BREAKPOINT_SET_COND_REQUEST:
      makePending(payload.bpId);
      break;
    case Constants.BREAKPOINT_SET_COND_SUCCESS:
      updateBreakpoint(null, payload.bpId, {condition: payload.condition});
      break;
    case Constants.BREAKPOINT_SET_COND_FAILURE:
      updateBreakpoint(payload.error, payload.bpId);
      break;

    case Constants.BREAKPOINT_CLEAR_REQUEST:
      makePending(payload.bpId);
      break;
    case Constants.BREAKPOINT_CLEAR_SUCCESS:
      clearBreakpoint(null, payload.bpId);
      break;
    case Constants.BREAKPOINT_CLEAR_FAILURE:
      clearBreakpoint(payload.error, payload.bpId);
      break;

    case Constants.BREAKPOINT_CLEAR_ALL_REQUEST:
      break;
    case Constants.BREAKPOINT_CLEAR_ALL_SUCCESS:
      clearAllBreakpoints(null);
      break;
    case Constants.BREAKPOINT_CLEAR_ALL_FAILURE:
      clearAllBreakpoints(payload.error);
      break;

    default: return;
    }
  }
}

const bpStore = new BreakpointStore(DelveDispatcher);
export default bpStore;

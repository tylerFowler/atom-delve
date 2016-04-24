/**
  BreakpointStore
  @description stores information about current breakpoints and provides
    actions to create & clear breakpoints
**/
'use babel';

const Store = require('flux/utils').Store;
import Constants from '../constants/breakpointConstants';

let _breakpoints = [];
/**
  @name BreakpointStore#addBreakpoint
  @desc adds the given breakpoint to the list
  @param {error} err => if present removes the pending breakpoint
  @param {object} bp => the breakpoint in the format defined by Delvejs
**/
function addBreakpoint(err, bp) {
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
  @param {object} location
  @param {string} location.file
  @param {number} location.line
**/
function addPending(name, location) {
  _breakpoints.push({id: -1, name, location, pendingChange: true});
}

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
  @name BreakpointStore#updateBreakpoint
  @desc updates the breakpoint w/ the given id w/ the given prop changes
  @param {error} err
  @param {number} id
  @param {object} updatedProps
**/
function updateBreakpoint(err, id, updatedProps) {
  let bp = _breakpoints.find(b => b.id === id);

  if (err) {
    bp.pendingChange = false;
    return atom.notifications.addError('Error setting breakpoint condition', {
      detail: err.toString(), dismissable: true
    });
  }

  bp = Object.assign(bp, updatedProps);
}

export default class BreakpointStore extends Store {
  constructor(dispatcher) {
    super(dispatcher);
  }

  getBreakpoints() {
    return _breakpoints;
  }

  getBreakpointById(id) {
    return _breakpoints.find(bp => bp.id === id);
  }

  getNextBreakpointName() {
    return length(_breakpoints);
  }

  __onDispatch(payload) {
    switch (payload.type) {
    case Constants.BREAKPOINT_CREATE_REQUEST:
      addPending(payload.name, payload.location);
      break;
    case Constants.BREAKPOINT_CREATE_SUCCESS:
      addBreakpoint(null, payload.bp);
      break;
    case Constants.BREAKPOINT_CREATE_FAILURE:
      addBreakpoint(payload.error, {name: payload.name});
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

    default: return;
    }
  }
}

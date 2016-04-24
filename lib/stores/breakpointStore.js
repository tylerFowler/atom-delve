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
  @param {error} err
  @param {object} bp => the breakpoint in the format defined by Delvejs
**/
function addBreakpoint(err, bp) {
  if (err) return atom.notifications.addError('Error adding breakpoint', {
    dismissable: true, detail: err.toString()
  });

  bp.isPending = false;
  let idx = _breakpoints.findIndex(b => b.id < 0 && b.name === bp.name);
  if (pending >= 0) _breakpoints[idx] = bp;
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
  _breakpoints.push({id: -1, name, location, isPending: true});
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
      addPending(payload.name, payload.location); break;
    case Constants.BREAKPOINT_CREATE_SUCCESS:
      addBreakpoint(null, payload.bp); break;
    case Constants.BREAKPOINT_CREATE_FAILURE:
      addBreakpoint(payload.error, null); break;
    default: return;
    }
  }
}

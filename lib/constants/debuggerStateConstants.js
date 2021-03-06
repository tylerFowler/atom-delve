'use babel';

const keyMirror = require('keymirror');

export default keyMirror({
  DEBUGGER_CONTINUE: null,

  DEBUGGER_NEXT: null,
  DEBUGGER_NEXT_FAILURE: null,

  DEBUGGER_STEP: null,
  DEBUGGER_STEP_FAILURE: null,

  DEBUGGER_STEP_INSTR: null,
  DEBUGGER_STEP_INSTR_FAILURE: null,

  DEBUGGER_RESTART: null,
  DEBUGGER_RESTART_FAILURE: null,

  DEBUGGER_EXITED: null,
  DEBUGGER_UNKOWN_ERROR: null
});

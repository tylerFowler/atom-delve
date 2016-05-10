'use babel';
/**
  Toolbar
  @description provides a visual toolbar that contains buttons for controlling
    the debugger state and other actions
**/

/* eslint no-unused-vars:0 */
import { BreakpointStore, DebuggerStateStore as StateStore } from '../stores';
import { DebuggerActions }     from '../actions';
import { CompositeDisposable } from 'atom';

export default class ToolbarView {
  constructor() {
    let $toolbar = document.createElement('div');
    $toolbar.classList.add('delve-toolbar');

    atom.workspace.addTopPanel({ item: $toolbar, priority: -100 });

    this.element = $toolbar;
  }

  destroy() {
    this.element.destroy();
  }
}

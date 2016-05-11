'use babel';
/**
  Toolbar
  @description provides a visual toolbar that contains buttons for controlling
    the debugger state and other actions
**/

/* eslint no-unused-vars:0 */
import { BreakpointStore, DebuggerStateStore as StateStore } from '../stores';
import { createClass as createJSX, jsx } from 'vanilla-jsx';
import { DebuggerActions }     from '../actions';
import { CompositeDisposable } from 'atom';

/** @jsx jsx */
const ToolbarMarkup = createJSX({
  renderView(data) {
    return (
    <div class="delve-toolbar">
    </div>
    );
  }
});

export default class ToolbarView {
  constructor() {
    this.$toolbar = new ToolbarMarkup();
    this.element = atom.workspace.addTopPanel({
      item: this.$toolbar.render(), priority: -100
    });
  }

  destroy() {
    this.$toolbar.dispose();
    this.element.destroy();
  }
}

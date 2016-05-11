'use babel';
/**
  Toolbar
  @description provides a visual toolbar that contains buttons for controlling
    the debugger state and other actions

  Controls to add (tooltips should have names):
  [ ] Continue (play icon)
  [ ] Restart (rewind icon)
  [ ] Next (?)
  [ ] Step (into icon)
  [ ] Step Into (into w/ braces (indent guide) icon)
  [ ] Clear Breakpoints (?)
  [ ] Stop Session (stop icon)

  TODO: add toggles for varius menus? (i.e. stack viewer)
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
      <ul>
        <li><button onclick="{data.onContinue}" class="continue"/></li>
        <li><button onclick="{data.onRestart}" class="restart"/></li>
        <li><button onclick="{data.onNext}" class="next"/></li>
        <li><button onclick="{data.onStep}" class="step"/></li>
        <li><button onclick="{data.onStepInto}" class="step-into"/></li>
        <li><button onclick="{data.onClearBreakpoints}" class="clear-breakpoints"/></li>
        <li><button onclick="{data.onStop}" class="stop"/></li>
      </ul>
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

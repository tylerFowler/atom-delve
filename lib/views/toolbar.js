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
        <li><button onclick="onContinue" class="continue"/></li>
        <li><button onclick="onRestart" class="restart"/></li>
        <li><button onclick="onNext" class="next"/></li>
        <li><button onclick="onStep" class="step"/></li>
        <li><button onclick="onStepInto" class="step-into"/></li>
        <li><button onclick="onClearBreakpoints" class="clear-breakpoints"/></li>
        <li><button onclick="onStop" class="stop"/></li>
      </ul>
    </div>
    );
  }
});

export default class ToolbarView {
  constructor() {
    this.$toolbar = new ToolbarMarkup();
    this.$_rendered = this.$toolbar.render(this);
    this.element = atom.workspace.addTopPanel({
      item: this.$_rendered, priority: -100
    });

    // assign click handlers for each button, since we can't use the
    // inline onclick attribute due to CSP restrictions
    let toolbarItems = this.$_rendered.children[0].children;
    for (let i = 0; i < toolbarItems.length; i++) {
      let $btn = toolbarItems[i].children[0];
      let clickFn = $btn.attributes.onclick.value;

      console.log('btn is ', $btn);
      $btn.addEventListener('click', this[clickFn]);
      $btn.attributes.removeNamedItem('onclick');
    }
  }

  onContinue() {}
  onRestart() {}
  onNext() {}
  onStep() {}
  onStepInto() {}
  onClearBreakpoints() {}
  onStop() {}

  destroy() {
    this.$toolbar.dispose();
    this.element.destroy();
  }
}

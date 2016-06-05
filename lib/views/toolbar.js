'use babel';
/**
  Toolbar
  @description provides a visual toolbar that contains buttons for controlling
    the debugger state and other actions

  TODO: add toggles for varius menus? (i.e. stack viewer)
**/

/* eslint no-unused-vars:0 */
import { BreakpointStore, DebuggerStateStore as StateStore } from '../stores';
import { createClass as createJSX, jsx } from 'vanilla-jsx';
import { DebuggerActions, BreakpointActions }     from '../actions';
import { CompositeDisposable } from 'atom';

/** @jsx jsx */
const ToolbarMarkup = createJSX({
  renderView(data) {
    return (
    <div class="delve-toolbar">
      <ul>
        <li><button onclick="onContinue" class="continue" title="Continue"/></li>
        <li><button onclick="onStop" class="stop" title="Stop"/></li>
        <li><button onclick="onRestart" class="restart" title="Restart"/></li>
        <li><button onclick="onNext" class="next" title="Next"/></li>
        <li><button onclick="onStep" class="step" title="Step"/></li>
        <li><button onclick="onStepInstr" class="step-instruction" title="Step Instruction"/></li>
        <li><button onclick="onClearBreakpoints" class="clear-breakpoints" title="Clear Breakpoints"/></li>
      </ul>
    </div>
    );
  }
});

export default class ToolbarView {
  constructor(endSessionFn) {
    this.endSession = endSessionFn;
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

      $btn.addEventListener('click', this[clickFn].bind(this));
      $btn.attributes.removeNamedItem('onclick');
    }
  }

  onContinue()         { DebuggerActions.continueToBreakpoint();  }
  onStop()             { this.endSession();                       }
  onRestart()          { DebuggerActions.restartProcess();        }
  onNext()             { DebuggerActions.nextInScope();           }
  onStep()             { DebuggerActions.step();                  }
  onStepInstr()        { DebuggerActions.stepInstruction();       }
  onClearBreakpoints() { BreakpointActions.clearAllBreakpoints(); }

  destroy() {
    this.$toolbar.dispose();
    this.element.destroy();
  }
}

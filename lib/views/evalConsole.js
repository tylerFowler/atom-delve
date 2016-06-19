'use babel';
/**
  Eval Console
  @description Provides a console where user can enter input in order to
    evaluate Go expressions within the current scope of the debugger in
    a REPL-esque style

  TODO: We will need to listen for the enter key from the input element,
    after hitting enter:
    - send to DebuggerActions.evalExpression (should return promise w/ result)
    - get result & write under the input (need to figure out how we're going to
        pretty print the resulting Go code)
    - disable the "spent" input element
    - create a new input element at the bottom of the console

  TODO: for the eval console input we might want to use a textarea to allow
    the user to type in multiple lines
**/

/* eslint no-unused-vars:0 */
import { createClass as createJSX, jsx } from 'vanilla-jsx';

/** @jsx jsx */
const DelveExprVal = createJSX({
  renderView(val) {
    return <pre className="delve-go-value">{val}</pre>;
  }
});

/** @jsx jsx */
const DelveEvalInput = createJSX({
  renderView() {
    return (
      <code class="delve-terminal-input-wrapper">
        <input type="text" class="delve-terminal-input delve-eval-textbox cur-input" />
      </code>
    );
  },

  deactivate() {
    this.element.children[0].disabled = true;
    this.element.children[0].classList.remove('cur-input');
  }
});

/** @jsx jsx */
const EvalConsoleElement = createJSX({
  renderView() {
    return (
      <div class="delve-terminal-panel delve-eval-console" ref="consoleContainer">
        <pre><strong>Eval Console</strong></pre>
      </div>
    );
  },

  addExpressionValue(val) {
    let outputComp = new DelveExprVal();
    let $val = outputComp.render(val);

    this.element.appendChild($val);
  },

  addNewEvalInput() {
    if (this.curInput) this.curInput.deactivate();
    let newInput = new DelveEvalInput();
    this.element.appendChild(newInput.render());
    this.curInput = newInput;

    // first child is always the <input /> itself
    return newInput.element.children[0];
  }
});

export default class EvalConsole {
  constructor() {
    this.consoleElement = new EvalConsoleElement();
    this.evalConsole = this.consoleElement.render();
    this.$curInput = this.consoleElement.addNewEvalInput();

    this.$curInput
    .addEventListener('keyup', this.sendEvalExpr.bind(this), true);
  }

  sendEvalExpr(evt) {
    if (evt.code !== 'Enter' || evt.shiftKey || !this.$curInput) return;

    const expression = this.$curInput.value.trim();

    atom.notifications.addInfo(
      'Would normally eval the expression', { detail: expression }
    );

    // NOTE: temporary
    const val = '&interface{}';
    this.consoleElement.addExpressionValue(val);
    this.$curInput = this.consoleElement.addNewEvalInput();

    this.$curInput
    .addEventListener('keyup', this.sendEvalExpr.bind(this), true);

    evt.preventDefault();
  }

  getElement() {
    return this.evalConsole;
  }

  destroy() {
    this.consoleElement.dispose();
  }
}

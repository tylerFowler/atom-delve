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
**/

/* eslint no-unused-vars:0 */
import { createClass as createJSX, jsx } from 'vanilla-jsx';

/** @jsx jsx */
const EvalConsoleElement = createJSX({
  createEvalInput() {
    return <input type="text" class="delve-terminal-input delve-eval-textbox" />;
  },

  renderView() {
    return (
      <div class="delve-terminal-panel delve-eval-console" ref="consoleContainer">
        {this.createEvalInput()}
      </div>
    );
  }
});

export default class EvalConsole {
  constructor() {
    this.consoleElement = new EvalConsoleElement();
    this.evalConsole = this.consoleElement.render();
  }

  getElement() {
    return this.evalConsole;
  }

  destroy() {
    this.consoleElement.dispose();
  }
}

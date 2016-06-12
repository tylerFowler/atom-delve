'use babel';
/**
  Input/Output Panel Component
  @description Creates a panel on the bottom of the screen that contains two
    subcomponents: a display for output from the Delve process, and a display
    for writing commands that can be sent to the process to be evaluated
**/

import EventEmitter from 'events';
import { CompositeDisposable } from 'atom';
import DelveOutputPanel from './delveOutputPanel';
import EvalConsole from './evalConsole';

class RuntimeOutputListener extends EventEmitter {
  constructor(emitter, stdoutEvt, stderrEvt) {
    super();
    this._srcEmitter = emitter;
    this._stdoutEvt = stdoutEvt;
    this._stdErrEvt = stderrEvt;

    emitter.on(stdoutEvt, this.stdoutHandler.bind(this));
    emitter.on(stderrEvt, this.stderrHandler.bind(this));
  }

  stdoutHandler(msg) {
    this.emit('messageOutput', { content: msg, type: 'info' });
  }

  stderrHandler(msg) {
    this.emit('messageOutput', { content: msg, type: 'error' });
  }

  dispose() {
    this._srcEmitter.removeListener(this._stdoutEvt, this.stdoutHandler);
    this._srcEmitter.removeListener(this._stderrEvt, this.stderrHandler);
  }
}

export default class DelveIOPanel {
  /**
    @constructor
    @desc creates views for the IO panel components & initializes the output
      listener
    @param {object} outputSrc
    @param {EventEmitter} outputSrc.emitter
    @param {string} outputSrc.stdoutEvt
    @param {string} outputSrc.stderrEvt
  **/
  constructor(outputSrc) {
    this.subscriptions = new CompositeDisposable();
    this.element = null;

    let { emitter, stdoutEvt, stderrEvt } = outputSrc;
    this.outputListener =
    new RuntimeOutputListener(emitter, stdoutEvt, stderrEvt);

    this.outputPanel = new DelveOutputPanel(this.outputListener);
    this.evalConsole = new EvalConsole();

    this.render();
  }

  render() {
    let $panelContainer = document.createElement('div');
    $panelContainer.classList.add('delve-io-panel');

    // allow us to copy text
    $panelContainer.classList.add('native-key-bindings');

    // allow us to select text
    $panelContainer.setAttribute('tabindex', -1);

    let $leftPanel = document.createElement('div');
    $leftPanel.classList.add('delve-io-left-panel');
    $leftPanel.appendChild(this.outputPanel.getElement());
    $panelContainer.appendChild($leftPanel);

    let $rightPanel = document.createElement('div');
    $rightPanel.classList.add('delve-io-right-panel');
    $rightPanel.appendChild(this.evalConsole.getElement());
    $panelContainer.appendChild($rightPanel);

    this.element = atom.workspace.addBottomPanel({
      item: $panelContainer,
      priority: 0
    });
  }

  destroy() {
    this.subscriptions.dispose();
    this.outputListener.dispose();
    this.element.destroy();
    this.outputPanel.destroy();
    this.evalConsole.destroy();
  }
}

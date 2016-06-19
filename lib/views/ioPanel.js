'use babel';
/**
  Input/Output Panel Component
  @description Creates a panel on the bottom of the screen that contains two
    subcomponents: a display for output from the Delve process, and a display
    for writing commands that can be sent to the process to be evaluated

  TODO: allow panel to be resized
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
    // stdout is grouped into a single event if outputted in sequence,
    // we want separate "messages" for each one
    msg.toString().split('\n').forEach(msgText =>
      this.emit('messageOutput', { content: msgText, type: 'info' })
    );
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
    this._$panelContainer = $panelContainer;
    $panelContainer.classList.add('delve-io-panel');

    // allow us to copy text
    $panelContainer.classList.add('native-key-bindings');

    // allow us to select text
    $panelContainer.setAttribute('tabindex', -1);

    let $titleBar = this.buildTitleBar();
    this._$titleBar = $titleBar;
    $panelContainer.appendChild($titleBar);

    let $leftPanel = document.createElement('div');
    this._$leftPanel = $leftPanel;
    $leftPanel.classList.add('delve-io-left-panel');
    $leftPanel.appendChild(this.outputPanel.getElement());
    $panelContainer.appendChild($leftPanel);

    let $resizeHandle = document.createElement('div');
    this._$resizeHandle = $resizeHandle;
    $resizeHandle.classList.add('delve-io-panel-resizer');
    $resizeHandle.addEventListener('mousedown', this.handleHorizResize.bind(this));
    $panelContainer.appendChild($resizeHandle);

    let $rightPanel = document.createElement('div');
    this._$rightPanel = $rightPanel;
    $rightPanel.classList.add('delve-io-right-panel');
    $rightPanel.appendChild(this.evalConsole.getElement());
    $panelContainer.appendChild($rightPanel);

    this.element = atom.workspace.addBottomPanel({
      item: $panelContainer,
      priority: 1000
    });
  }

  buildTitleBar() {
    let $titleBar = document.createElement('div');
    $titleBar.classList.add('delve-io-title-bar');

    let $titleBarText = document.createElement('span');
    $titleBarText.innerText = 'Delve IO Panel';
    $titleBarText.classList.add('delve-io-title-text');

    let $titleBarActions = document.createElement('span');
    $titleBarActions.classList.add('delve-io-title-actions');

    let $titleBarMinimize = document.createElement('a');
    $titleBarMinimize.innerText = 'Minimize';
    $titleBarMinimize.classList.add('delve-io-action');
    $titleBarMinimize.classList.add('minimize');
    $titleBarActions.appendChild($titleBarMinimize);
    $titleBarMinimize.addEventListener('click', this.minimize.bind(this));

    let $titleBarMaximize = document.createElement('a');
    $titleBarMaximize.innerText = 'Maximize';
    $titleBarMaximize.classList.add('delve-io-action');
    $titleBarMaximize.classList.add('maximize');
    $titleBarActions.appendChild($titleBarMaximize);

    $titleBar.appendChild($titleBarText);
    $titleBar.appendChild($titleBarActions);

    return $titleBar;
  }

  minimize() {
    if (this._$leftPanel.style.display === 'none') {
      this._$leftPanel.style.display = '';
      this._$rightPanel.style.display = '';
      this._$resizeHandle.style.display = '';
    } else {
      this._$leftPanel.style.setProperty('display', 'none');
      this._$rightPanel.style.setProperty('display', 'none');
      this._$resizeHandle.style.setProperty('display', 'none');
    }
  }

  handleHorizResize(srcEvt) {
    const $root = document.documentElement;
    const startX = srcEvt.clientX;
    const startLeftW = parseInt(
      document.defaultView.getComputedStyle(this._$leftPanel).width, 10
    );

    const startRightW = parseInt(
      document.defaultView.getComputedStyle(this._$rightPanel).width, 10
    );

    const minWidth = 250;
    const maxWidth = parseInt(
      document.defaultView.getComputedStyle(this._$panelContainer).width, 10
    );

    const part = maxWidth / 100;

    let doDrag = (evt) => {
      let isLeftDrag = evt.clientX - startX < 0;

      if (isLeftDrag) {
        let newLeftW = startLeftW + evt.clientX - startX;
        if (newLeftW <= minWidth) return;

        let newRightW = startRightW - (evt.clientX - startX);

        this._$leftPanel.style.width = `${newLeftW / part}%`;
        this._$rightPanel.style.width = `${newRightW / part}%`;
      } else {
        let newRightW = startRightW + startX - evt.clientX;
        if (newRightW <= minWidth) return;

        let newLeftW = startLeftW + (evt.clientX - startX);

        this._$leftPanel.style.width = `${newLeftW / part}%`;
        this._$rightPanel.style.width = `${newRightW / part}%`;
      }
    };
    doDrag = doDrag.bind(this);

    let stopDrag = () => {
      $root.removeEventListener('mousemove', doDrag, false);
      $root.removeEventListener('mouseup', stopDrag, false);
    };
    stopDrag = stopDrag.bind(this);

    $root.addEventListener('mousemove', doDrag, false);
    $root.addEventListener('mouseup', stopDrag, false);
  }

  destroy() {
    this.subscriptions.dispose();
    this.outputListener.dispose();
    this.element.destroy();
    this.outputPanel.destroy();
    this.evalConsole.destroy();
  }
}

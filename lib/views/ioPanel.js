'use babel';
/**
  Input/Output Panel Component
  @description Creates a panel on the bottom of the screen that contains two
    subcomponents: a display for output from the Delve process, and a display
    for writing commands that can be sent to the process to be evaluated

  TODO: allow panel to be resized
**/

const _ = require('underscore');

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

    this.subscriptions.add(atom.commands.add(
      'atom-workspace',
      'atom-delve:toggle-IO-panel', () => this.toggleMinimize()
    ));

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

    let $topResizeHandle = document.createElement('div');
    $topResizeHandle.classList.add('delve-io-resizer');
    $topResizeHandle
    .addEventListener('mousedown', this.handleVertResize.bind(this));
    $panelContainer.appendChild($topResizeHandle);

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
    $resizeHandle
    .addEventListener('mousedown', this.handleHorizResize.bind(this));
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
    $titleBarMinimize.addEventListener('click', this.toggleMinimize.bind(this));

    $titleBar.appendChild($titleBarText);
    $titleBar.appendChild($titleBarActions);

    return $titleBar;
  }

  toggleMinimize() {
    const minimizedSize = '1.5em'; // pulled from `styles/io-panel.less`

    if (this._$panelContainer.style.height !== minimizedSize)
      this._$panelContainer.style.height = minimizedSize;
    else
      this._$panelContainer.style.height = '';
  }

  /**
    @name IOPanel#handleHorizResize
    @event $resizeHandle -> mousedown
    @desc allows the two vertical panels to be resized, shifting percentages

    BUG: if these are resized so that one is very small, when the window
      goes to a lower size then the two panels will break into different
      lines, could recalculate percentages on window resize
  **/
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

      evt.preventDefault();
      evt.stopPropagation();
    };
    doDrag = _.throttle(doDrag.bind(this), 15);

    let stopDrag = () => {
      $root.removeEventListener('mousemove', doDrag);
      $root.removeEventListener('mouseup', stopDrag);
    };
    stopDrag = stopDrag.bind(this);

    $root.addEventListener('mousemove', doDrag);
    $root.addEventListener('mouseup', stopDrag);

    srcEvt.preventDefault();
    srcEvt.stopPropagation();
  }

  handleVertResize(srcEvt) {
    const $root = document.documentElement;
    const startY = srcEvt.clientY;

    const startPnlHeight = parseInt(
      document.defaultView.getComputedStyle(this._$panelContainer).height, 10
    );

    let doDrag = (evt) => {
      let isDownDrag = evt.clientY - startY > 0;

      if (isDownDrag) {
        let newHeight = startPnlHeight - (evt.clientY - startY);
        if (newHeight < 50) return;

        this._$panelContainer.style.height = `${newHeight}px`;
      } else
        this._$panelContainer.style.height
          = `${startPnlHeight + startY - evt.clientY}px`;
    };
    doDrag = _.throttle(doDrag.bind(this), 15);

    const stopDrag = () => {
      $root.removeEventListener('mousemove', doDrag);
      $root.removeEventListener('mouseup', stopDrag);
    };

    $root.addEventListener('mousemove', doDrag);
    $root.addEventListener('mouseup', stopDrag);

    srcEvt.preventDefault();
    srcEvt.stopPropagation();
  }

  destroy() {
    this.subscriptions.dispose();
    this.outputListener.dispose();
    this.element.destroy();
    this.outputPanel.destroy();
    this.evalConsole.destroy();
  }
}

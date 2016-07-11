'use babel';
/**
  Stack Explorer Component
  @description Creates a tabbed side panel that displays information about
    the program's stacks, has the following tabs:
      - Stacktrace: show the stacktrace @ the current source line
      - Goroutines: show the running goroutines @ the current source line
      - Variables: shows the variables in the current scope
      - Breakpoints: view breakpoints and deactivate them

    Should be able to click on stack/goroutine frames and go to the source,
    and should be able to do the same for breakpoints

    TODO: make this extend EventEmitter and then emit an event for changes
      in tab selection (to trigger redraw)
    TODO: find a better way to represent the panel, maybe go full blown React
**/

/* eslint no-unused-vars:0 */
import { CompositeDisposable } from 'atom';
import { BreakpointStore, DebuggerStateStore as StateStore } from '../stores';
import StacktracePanel from './stacktracePanel';
import { createClass as createJSX, jsx } from 'vanilla-jsx';

/** @jsx jsx */
const TabContainer = createJSX({
  renderView() {
    return (
      <ul class="tab-container">
        <li class="tab stacktrace-tab active"><h1>Stacktrace</h1></li>
        <li class="tab goroutine-tab"><h1>Goroutines</h1></li>
        <li class="tab variables-tab"><h1>Variables</h1></li>
        <li class="tab breakpoints-tab"><h1>Breakpoints</h1></li>
      </ul>
    );
  }
});

export default class StackExplorerPanel {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.element = null;
    this.$selectedTab = null;
    this.tabContainer = new TabContainer();
    this.$tabContainer = this.tabContainer.render();

    this.stacktracePnl = new StacktracePanel();

    this.state = null;
    this.stacktrace = [];
    this.goroutines = [];
    this.variables = [];
    this.breakpoints = [];

    // Register Flux Stores
    this._stateStoreRm = StateStore
    .addListener(this.updateState.bind(this)).remove;

    this._bpStoreRm = BreakpointStore
    .addListener(this.updateBreakpoints.bind(this)).remove;

    this.render();
  }

  render() {
    let $panelContainer = document.createElement('div');
    $panelContainer.classList.add('delve-stack-panel');
    this._$panelContainer = $panelContainer;

    this.initTabBar();
    $panelContainer.appendChild(this.$tabContainer);

    let $explorerContainer = document.createElement('div');
    $explorerContainer.classList.add('delve-explorer-container');
    this._$explorerContainer = $explorerContainer;
    $panelContainer.appendChild($explorerContainer);

    $explorerContainer.appendChild(this.stacktracePnl.getElement());

    this.element = atom.workspace.addRightPanel({
      item: $panelContainer,
      priority: 200
    });
  }

  initTabBar() {
    // Default active is stacktrace
    this.$selectedTab = this.$tabContainer.children[0];

    for (let i = 0; i < this.$tabContainer.children.length; i++) {
      const $tab = this.$tabContainer.children[i];
      $tab.addEventListener('click', () => {
        if (this.$selectedTab) this.$selectedTab.classList.remove('active');
        $tab.classList.add('active');
        this.$selectedTab = $tab;
      });
    }
  }

  updateState() {
    this.stacktracePnl.updateStacktrace(StateStore.getStacktrace());
  }

  updateBreakpoints() {
    this.breakpoints = BreakpointStore.getBreakpoints();
  }

  destroy() {
    this._stateStoreRm();
    this._bpStoreRm();

    if (this.tabContainer) this.tabContainer.dispose();
    if (this.element) this.element.destroy();
  }
}

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
**/

import { CompositeDisposable } from 'atom';
import { BreakpointStore, DebuggerStateStore as StateStore } from '../stores';

export default class StackExplorerPanel {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.element = null;
    this.$selectedTab = null;
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
    this._$panelContainer = $panelContainer;

    $panelContainer.classList.add('delve-stack-panel');
    $panelContainer.appendChild(this.buildTabBar());

    this.element = atom.workspace.addRightPanel({
      item: $panelContainer,
      priority: 200
    });
  }

  buildTabBar() {
    let $tabBar = document.createElement('ul');
    $tabBar.classList.add('tab-container');

    let $stackTab = document.createElement('li');
    $stackTab.classList.add('tab');
    $stackTab.classList.add('stacktrace-tab');
    $stackTab.innerHTML = '<h1>Stacktrace</h1>';
    $tabBar.appendChild($stackTab);

    let $grTab = document.createElement('li');
    $grTab.classList.add('tab');
    $grTab.classList.add('goroutine-tab');
    $grTab.innerHTML = '<h1>Goroutines</h1>';
    $tabBar.appendChild($grTab);

    let $varTab = document.createElement('li');
    $varTab.classList.add('tab');
    $varTab.classList.add('variables-tab');
    $varTab.innerHTML = '<h1>Variables</h1>';
    $tabBar.appendChild($varTab);

    let $bpTab = document.createElement('li');
    $bpTab.classList.add('tab');
    $bpTab.classList.add('breakpoints-tab');
    $bpTab.innerHTML = '<h1>Breakpoints</h1>';
    $tabBar.appendChild($bpTab);

    // Default active is stacktrace
    $stackTab.classList.add('active');
    this.$selectedTab = $stackTab;

    for (let i = 0; i < $tabBar.children.length; i++) {
      const $tab = $tabBar.children[i];
      $tab.addEventListener('click', () => {
        $tab.classList.add('active');
        if (this.$selectedTab) this.$selectedTab.classList.remove('active');
        this.$selectedTab = $tab;
      });
    }

    return $tabBar;
  }

  updateState() {
    this.stacktrace = StateStore.getStacktrace();
    this.state = StateStore.getState();
    this.goroutines = StateStore.getGoroutines();
  }

  updateBreakpoints() {
    this.breakpoints = BreakpointStore.getBreakpoints();
  }

  destroy() {
    this._stateStoreRm();
    this._bpStoreRm();

    if (this.element) this.element.destroy();
  }
}

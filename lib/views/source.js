'use babel';
/**
  Source Controller-View Component
  @description Source component is controller-view for the breakpoint &
    scope highlighter views.
    Also responsible for moving the source with the state.
**/

import ScopeNavigator          from './scopeNavigator';
import BreakpointGutter        from './breakpointGutter';
import Config                  from '../config';
import { CompositeDisposable } from 'atom';
import { BreakpointStore, DebuggerStateStore as StateStore } from '../stores';

export default class SourceView {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.breakpointGutters = [];
    this.scopeNavigator = new ScopeNavigator(atom.workspace, {
      usePending: Config.usePendingOnJump
    });

    // Flux Store remove functions
    this._bpStoreRm = BreakpointStore
    .addListener(this.refreshBreakpoints.bind(this)).remove;

    this._stateStoreRm = StateStore
    .addListener(this.updateScopeNavigator.bind(this)).remove;

    this.initBreakpointView();
  }

  initBreakpointView() {
    const initNewGutter = editor => {
      // make sure this is a go file before adding
      if (editor.getGrammar().scopeName !== 'source.go') return;

      let gutterBreakpoints = BreakpointStore
      .getBreakpointsForFile(editor.getPath());

      // TODO: may also have to listen on onDidAddGutter for line #,
      // use promises?
      let lineGutter = editor.gutterWithName('line-number');
      let bpGutter = new BreakpointGutter(
        editor, gutterBreakpoints, atom.views.getView(lineGutter)
      );

      this.breakpointGutters.push(bpGutter);
    };

    this.disposables.add(atom.workspace.observeTextEditors(initNewGutter.bind(this)));
  }

  refreshBreakpoints() {
    this.breakpointGutters.forEach(bpGutter => bpGutter.updateBreakpoints(
        BreakpointStore.getBreakpointsForFile(bpGutter.getFile())
      )
    );
  }

  updateScopeNavigator() {
    this.scopeNavigator.setScope(StateStore.getScope());
  }

  destroy() {
    this._bpStoreRm();
    this._stateStoreRm();
    this.breakpointGutters.forEach(gutter => gutter.destroy());
    this.scopeNavigator.destroy();
  }

  dispose() {
    this.disposables.dispose();
  }
}

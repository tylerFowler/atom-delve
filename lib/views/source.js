'use babel';
/**
  Source Controller-View Component
  @description Source component is controller-view for the breakpoint &
    scope highlighter views.
    Also responsible for moving the source with the state.

  TODO currently the breakpoint & source navigators don't carry over
    their markers to active files that are closed and then opened again
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

      const lineGutter = editor.gutterWithName('line-number');

      // TODO: this isn't a very good ID, use a better (possibly random)
      // solution
      const gutterId = this.breakpointGutters.length;
      let bpGutter = new BreakpointGutter(
        gutterId, editor, gutterBreakpoints, atom.views.getView(lineGutter)
      );

      this.breakpointGutters.push(bpGutter);

      let destroyGutter = () => this.destroyGutterWithId(gutterId);
      this.disposables.add(editor.onDidDestroy(destroyGutter.bind(this)));
    };

    this.disposables.add(
      atom.workspace.observeTextEditors(initNewGutter.bind(this))
    );
  }

  refreshBreakpoints() {
    this.breakpointGutters.forEach(bpGutter => bpGutter.updateBreakpoints(
        BreakpointStore.getBreakpointsForFile(bpGutter.getFile())
      )
    );
  }

  destroyGutterWithId(id) {
    let gutter = this.breakpointGutters.find(g => g.id === id);

    if (gutter) {
      const gutterIdx = this.breakpointGutters.findIndex(g => g.id === id);
      gutter.destroy();
      this.breakpointGutters = this.breakpointGutters.splice(gutterIdx, 1);
    }
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

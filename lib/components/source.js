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
import { BreakpointStore }     from '../stores';
import { CompositeDisposable } from 'atom';

export default class SourceView {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.breakpointGutters = [];

    // Flux Store remove functions
    this._bpStoreRm = BreakpointStore
    .addListener(this.refreshBreakpoints).remove;

    // TODO: once we get a DebuggerStateStore use the inital state as opts
    // if we have one
    this.scopeNavigator = new ScopeNavigator(atom.workspace, {
      usePending: Config.usePendingOnJump
    });

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

    this.disposables.add(atom.workspace.observeTextEditors(initNewGutter).bind(this));
  }

  refreshBreakpoints() {
    this.breakpointGutters.forEach(bpGutter => bpGutter.updateBreakpoints(
        BreakpointStore.getBreakpointsForFile(bpGutter.getFile())
      )
    );
  }

  destroy() {
    this._bpStoreRm();
    this.breakpointGutters.forEach(gutter => gutter.destroy());
    this.scopeNavigator.destroy();
  }

  dispose() {
    this.disposables.dispose();
  }
}

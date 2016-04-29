/**
  Source Controller-View Component
  @description Source component is controller-view for the breakpoint &
    scope highlighter views.
    Also responsible for moving the source with the state.
**/
'use babel';

import { BreakpointStore }     from '../stores';
import { CompositeDisposable } from 'atom';

export default class SourceView {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.breakpointGutters = [];

    // Flux Store remove functions
    this._bpStoreRm = BreakpointStore
      .addListener(this.refreshBreakpoints).remove;

    const initNewGutter = editor => {
      // make sure this is a go file before adding
      if (editor.getGrammar().scopeName !== 'scope.go') return;

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

    this.disposables.add(atom.workspace.observeTextEditors(initNewGutter));
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
  }

  dispose() {
    this.disposables.dispose();
  }
}

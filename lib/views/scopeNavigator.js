'use babel';
/**
  Scope Navigator
  @description Marks and sets highlighting on the current debugger scope,
    navigating to the file if necessary

  TODO: decide if we want to keep track of files that we've opened & close
    them when the ScopeNavigator is destroyed() (since ScopeNavigator will
    be active for the entirety of the debugging session)
**/

import { CompositeDisposable } from 'atom';

export default class ScopeNavigator {
  /**
    @constructor
    @desc initialize current position and render it if we have one, opening
      the file if necessary
    @param {Workspace} workspace
    @param {object} opts :optional
    @param {boolean} opts.usePending :default => true
    @param {object} opts.initialPosition => usually will be null
    @param {string} opts.initialPosition.file
    @param {number} opts.initialPosition.line
  **/
  constructor(workspace, opts) {
    this.disposables = new CompositeDisposable();
    this.workspace = workspace;
    this.options = opts;
    this.curMarker = null;
    this.copyMarkers = [];

    if (opts && opts.initialPosition
    && opts.initialPosition.file && opts.initialPosition.line)
      this.setScope(opts.initialPosition);
  }

  /**
    @name ScopeNavigator#navToScope
    @desc move focus to the file & line specified by scope, opening if
      necessary & highlighting the debugger's last known position
    @param {object} scope
    @param {string} scope.file
    @param {number} scope.line
    @returns Promise<TextEditor> holds TextEditor of current scope
  **/
  navToScope(scope) {
    this.clearMarkers();

    const writeScopeMarker = (editor, curLine) => {
      const range = editor.getBuffer().rangeForRow(curLine, true);
      const marker = editor.markBufferRange(range, { invalidate: 'never' });

      editor.decorateMarker(marker, {
        type: 'line',
        class: 'delve-cur-scope',
        onlyNonEmpty: true
      });

      return marker;
    };

    // Atom seems to enjoy deleting markers on all instances of a file once
    // one of them is closed
    const protectFromMistakenlyDestroyedMarker = (marker, editor, line) => {
      return marker.onDidDestroy(() => {
        if (editor.isAlive()) writeScopeMarker(editor, line);
      });
    };

    return this.workspace.open(scope.file, {
      initialLine: scope.line,
      searchAllPanes: true,
      pending: this.options.usePending || true
    })
    .then(editor => {
      this.curMarker = writeScopeMarker(editor, scope.line);
      this.disposables.add(
        protectFromMistakenlyDestroyedMarker(this.curMarker, editor, scope.line)
      );

      this.curMarkerSub = this.workspace.observeTextEditors(_editor => {
        if (_editor.getPath() !== scope.file) return;

        let markerCopy = writeScopeMarker(_editor, scope.line);
        this.disposables.add(
          protectFromMistakenlyDestroyedMarker(markerCopy, _editor, scope.line)
        );

        this.copyMarkers.push(markerCopy);
      });
    })
    .catch(err => atom.notifications.adddError(
      `Cannot navigate to ${scope.file}:${scope.line}`,
      { detail: err.toString(), dismissable: true }
    ));
  }

  /**
    @name ScopeNavigator#setScope
    @desc sets the scope given the current position, if given scope is null
      then it 'unsets' the current marker
    @param {object} scope
    @param {string} scope.file
    @param {number} scope.line
  **/
  setScope(scope) {
    if (scope) {
      scope.line = scope.line - 1; // correct for Atom 0 index vs Delve 1 index
      this.navToScope(scope);
    } else this.clearMarkers();
  }

  clearMarkers() {
    if (this.curMarker) this.curMarker.destroy();
    if (this.curMarkerSub) this.curMarkerSub.dispose();
    this.copyMarkers.forEach(copy => copy.destroy());
  }

  destroy() {
    this.workspace = null;
    this.disposables.dispose();
    this.clearMarkers();
  }
}

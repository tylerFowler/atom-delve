/**
  Scope Navigator
  @description Marks and sets highlighting on the current debugger scope,
    navigating to the file if necessary

  TODO: decide if we want to keep track of files that we've opened & close
    them when the ScopeNavigator is destroyed() (since ScopeNavigator will
    be active for the entirety of the debugging session)
**/
'use babel';

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
    this.workspace = workspace;
    this.options = opts;
    if (opts && opts.initialPosition.file && opts.initialPosition.line)
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
    return this.workspace.open(scope.file, {
      initialLine: scope.line,
      searchAllPanes: true,
      pending: this.options.usePending || true
    })
    .then(editor => {
      const range = editor.getBuffer().rangeForRow(scope.line, true);
      const marker = editor.markBufferRange(range, { invalidate: 'never' });
      this.curMarker = marker;

      editor.decorateMarker(marker, {
        type: 'line',
        class: 'delve-cur-scope',
        onlyNonEmpty: true
      });

      return editor;
    })
    .catch(err => atom.notifications.adddError(
      `Cannot navigate to ${scope.file}:${scope.line}`,
      { detail: err.toString(), dismissable: true }
    ));
  }

  setScope(scope) {
    scope.line = scope.line - 1; // correct for Atom 0 index vs Delve 1 index
    this.navToScope(scope);
  }

  destroy() {
    this.workspace = null;
    this.curMarker.destroy();
  }
}

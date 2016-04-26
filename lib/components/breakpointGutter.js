/**
  Breakpoint Gutter Component
  @description Creates a breakpoint gutter, allows the breakpoint
    functionality for creating/destroying breakpoints as well as drawing
    them, should have one of these *per* editor instance
**/
'use babel';

/* eslint no-unused-vars:0 */
import { BreakpointActions } from '../actions';

export default class BreakpointGutter {
  /**
    @constructor
    @desc initializes props, sets breakpoint toggle click listener, renders
      the initial breakpoints & creates breakpoint gutter
    @param {TextEditor} editor to put the breakpoint gutter in
    @param {object[]} editorBreakpoints => bps for a single editor
    @param {HTMLElement} $lineNumGutter
  **/
  constructor(editor, editorBreakpoints, $lineNumGutter) {
    this.editor = editor;
    this.editorBreakpoints = editorBreakpoints;
    this.breakpointDecorations = [];
    this.$lineNumGutter = $lineNumGutter;

    this.element = editor.addGutter({name: 'delve-breakpoint', priority: -100});
    this._registerToggleListener($lineNumGutter);
    this.render();
  }

  _registerToggleListener($targetGutter) {
    const _breakpointToggleListener = evt => {
      let $lineNumber = evt.target;
      let row = $lineNumber.attributes('data-buffer-row');
      if (row === null) return;

      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation();

      let existing = this.editorBreakpoints.find(b => b.location.line == row);

      if (existing)
        BreakpointActions.clearBreakpoint(existing.id);
      else
        BreakpointActions.create(null, this.editor.getPath(), row);
    };

    this._breakpointToggleListener = _breakpointToggleListener;
    $targetGutter.addEventListener('click', _breakpointToggleListener);
  }

  destroy() {
    this.$lineNumGutter
    .removeEventListener('click', this._breakpointToggleListener);

    this.element.destroy();
  }

  render() {
    this.breakpointDecorations.forEach(d => d.destroy());

    this.breakpointDecorations = this.editorBreakpoints.map(bp => {
      const row = bp.location.line - 1; // Atom is 0 indexed; Delve is 1 indexed
      const breakpoint = document.createElement('div');
      breakpoint.classList.add('breakpoint');
      if (bp.pendingChange) breakpoint.classList.add('is-pending');

      const marker = this.editor.markBufferPosition(
        this.editor.getBuffer().rangeForRow(row, false)
      );

      return this.element.decorateMarker(marker, {
        type: 'gutter', item: breakpoint
      });
    });
  }

  updateBreakpoints(breakpoints) {
    this.editorBreakpoints = breakpoints;
    this.render();
  }

  getElement() { return this.element; }
}
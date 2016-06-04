'use babel';
/**
  Breakpoint Gutter Component
  @description Creates a breakpoint gutter, allows the breakpoint
    functionality for creating/destroying breakpoints as well as drawing
    them, should have one of these *per* editor instance
**/

import { BreakpointActions } from '../actions';
import { CompositeDisposable } from 'atom';

export default class BreakpointGutter {
  /**
    @constructor
    @desc initializes props, sets breakpoint toggle click listener, renders
      the initial breakpoints & creates breakpoint gutter
    @param {number} id
    @param {TextEditor} editor to put the breakpoint gutter in
    @param {object[]} editorBreakpoints => bps for a single editor
    @param {HTMLElement} $lineNumGutter
  **/
  constructor(id, editor, editorBreakpoints, $lineNumGutter) {
    this.id = id;
    this.disposables = new CompositeDisposable();
    this.bpDisposables = new CompositeDisposable();
    this.editor = editor;
    this.breakpointDecorations = [];
    this.$lineNumGutter = $lineNumGutter;

    this.element = editor.addGutter({
      name: `delve-breakpoints${this.id}`, priority: 100
    });
    this._registerToggleListener($lineNumGutter);
    this.updateBreakpoints(editorBreakpoints);
  }

  _registerToggleListener($targetGutter) {
    const _breakpointToggleListener = evt => {
      let $lineNumber = evt.target;
      let row = parseInt($lineNumber.getAttribute('data-buffer-row'), 10);
      if (isNaN(row)) return;

      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation();

      let existing = this.editorBreakpoints
      .find(b => !b.pendingChange && b.location.line == row + 1);

      if (existing)
        BreakpointActions.clearBreakpoint(existing.id);
      else
        BreakpointActions.create(this.editor.getPath(), row);
    };

    this._breakpointToggleListener = _breakpointToggleListener.bind(this);
    $targetGutter.addEventListener('click', this._breakpointToggleListener);
  }

  destroy() {
    this.$lineNumGutter
    .removeEventListener('click', this._breakpointToggleListener);

    this.breakpointDecorations.forEach(d => d.marker.destroy());
    this.disposables.dispose();

    // we can't always destroy the gutter because it's already been removed
    // from it's gutter container
    try {
      this.element.destroy();
    } catch (err) { return; }
  }

  render() {
    this.bpDisposables.dispose();
    this.bpDisposables = new CompositeDisposable();
    this.breakpointDecorations.forEach(d => d.marker.destroy());

    this.breakpointDecorations = this.editorBreakpoints.map(bp => {
      const row = bp.location.line - 1; // Atom is 0 indexed; Delve is 1 indexed
      const buffer = this.editor.getBuffer();

      const $breakpoint = document.createElement('div');
      $breakpoint.classList.add('delve-breakpoint');
      if (bp.pendingChange) $breakpoint.classList.add('is-pending');

      $breakpoint.addEventListener('click', evt => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        BreakpointActions.clearBreakpoint(bp.id);
      });

      let range;
      if (buffer.isRowBlank(row))
        range = buffer.rangeForRow(buffer.nextNonBlankRow(row), false);
      else
        range = buffer.rangeForRow(row, false);

      const marker = this.editor.markBufferRange(range, {invalidate: 'never'});

      let decoration = this.element.decorateMarker(marker, {
        type: 'gutter', item: $breakpoint
      });

      // decorations are mistakenly destroyed when another editor of the same
      // file in a different pane is destroyed
      this.bpDisposables.add(decoration.onDidDestroy(() => {
        if (this.editor.isAlive()) this.render();
      }));

      return { decoration, marker };
    });
  }

  updateBreakpoints(breakpoints) {
    console.log('Updating breakpoints to: ', breakpoints);
    this.editorBreakpoints = breakpoints;
    this.render();
  }

  getFile() { return this.editor.getPath(); }
  getElement() { return this.element; }
}

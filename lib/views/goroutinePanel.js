'use babel';
/**
  GoroutinePanel
  @description displays the current goroutines, allows users to switch between
    them
**/

export default class StacktracePanel {
  constructor() {
    this.goroutines = [];

    let $grContainer = document.createElement('ul');
    $grContainer.classList.add('stackexplorer-view');
    $grContainer.classList.add('goroutine-view');

    this.element = $grContainer;
  }

  update(goroutines) {
    this.goroutines = goroutines;

    while (this.element.firstChild)
      this.element.removeChild(this.element.firstChild);

    goroutines.forEach(g => {
      let $g = document.createElement('li');
      $g.classList.add('stackexplorer-itm');
      $g.classList.add('stackframe');
      if (g.active) $g.classList.add('active');

      let $detailOne = document.createElement('span');
      $detailOne.classList.add('stack-detail');
      $detailOne.innerText = `${g.userCurrentLoc.file}:${g.userCurrentLoc.line}`;

      let $detailTwo = document.createElement('span');
      $detailTwo.classList.add('stack-detail');
      const pc = g.userCurrentLoc.pc.toString(16);
      $detailTwo.innerText = `${g.userCurrentLoc.function.name} (${pc})`;

      $g.appendChild($detailOne);
      $g.appendChild($detailTwo);
      this.element.appendChild($g);
    });
  }

  getElement() {
    return this.element;
  }
}

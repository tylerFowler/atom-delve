'use babel';
/**
  Stacktrace Viewer
  @description renders a view of the current stacktrace, allowing users to
    click on a trace to go to the source point
**/

export default class StacktracePanel {
  constructor() {
    this.stacktrace = [];

    let $stContainer = document.createElement('ul');
    $stContainer.classList.add('stackexplorer-view');
    $stContainer.classList.add('stacktrace-view');

    this.element = $stContainer;
  }

  updateStacktrace(stacktrace) {
    this.stacktrace = stacktrace;

    while (this.element.firstChild)
      this.element.removeChild(this.element.firstChild);

    stacktrace.forEach(st => {
      let $st = document.createElement('li');
      $st.classList.add('stackexplorer-itm');
      $st.classList.add('stackframe');
      if (st.active) $st.classList.add('active');

      let $detailOne = document.createElement('span');
      $detailOne.classList.add('stack-detail');
      $detailOne.innerText = `${st.pc} in ${st.function.name}`;

      let $detailTwo = document.createElement('span');
      $detailTwo.classList.add('stack-detail');
      $detailTwo.innerText = `at ${st.file}:${st.line}`;

      $st.appendChild($detailOne);
      $st.appendChild($detailTwo);
      this.element.appendChild($st);
    });
  }

  getElement() {
    return this.element;
  }
}

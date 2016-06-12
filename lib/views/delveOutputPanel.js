'use babel';
/**
  Delve Output View
  @description Text based view that reads from an output stream and displays
    it inside a terminal-esque window
**/

/* eslint no-unused-vars:0 */
import { createClass as createJSX, jsx } from 'vanilla-jsx';

/** @jsx jsx */
const DelveOutputMessage = createJSX({
  renderView(msg) {
    var classModifier;
    switch (msg.type) {
    case 'info':
      classModifier = 'delve-info-message'; break;
    case 'error':
      classModifier = 'delve-error-message'; break;
    default:
      classModifier = 'delve-info-message'; break;
    }

    const classes = `delve-output-message ${classModifier}`;
    return <pre className={classes}>{msg.content.toString()}</pre>;
  }
});

/** @jsx jsx */
const DelveOutputElement = createJSX({
  renderView(outputMessages) {
    this.messages = outputMessages.map(msg => {
      let msgComponent = new DelveOutputMessage();
      let $msg = msgComponent.render(msg);

      return { component: msgComponent, $msg };
    });

    return (
      <div class="delve-terminal-panel delve-output-panel" ref="panelContainer">
        {this.messages.map(msg => msg.$msg)}
      </div>
    );
  },

  addMessage(msg) {
    let component = new DelveOutputMessage();
    let $msg = component.render(msg);

    this.messages.push({ component, $msg });

    // TODO: this.refs isn't being set - why? Using this.element for now
    // this.refs.panelContainer.appendChild($message);
    this.element.appendChild($msg);
  },

  clearMessages() {
    this.messages.forEach(msg => msg.component.dispose());
    this.messages = [];
  }
});

export default class DelveOutputPanel {
  constructor(messageOutputStream, messages) {
    this.messages = messages || [];
    this.messageStream = messageOutputStream;

    this.outputElement = new DelveOutputElement();
    this.delveOutputPanel = this.outputElement.render(this.messages);

    this.msgConsumer = msg => this.outputElement.addMessage(msg);
    this.messageStream.on('messageOutput', this.msgConsumer.bind(this));
  }

  getElement() {
    return this.delveOutputPanel;
  }

  destroy() {
    this.outputElement.clearMessages();
    this.outputElement.dispose();
    this.messages = null;

    this.messageStream.removeListener('messageOutput', this.msgConsumer);
  }
}

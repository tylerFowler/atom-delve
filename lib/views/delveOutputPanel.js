'use babel';
/**
  Delve Output View
  @description Text based view that reads from an output stream and displays
    it inside a terminal-esque window
**/

/* eslint no-unused-vars:0 */
import { createClass as createJSX, jsx } from 'vanilla-jsx';

/** @jsx jsx */
const DelveOutputElement = createJSX({
  createMsgItem(msg) {
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
    return <pre className={classes}>{msg.content}</pre>;
  },

  renderView(outputMessages) {
    let messageElements = outputMessages.map(this.createMsgItem);

    return (
      <div class="delve-terminal-panel delve-output-panel" ref="panelContainer">
        {messageElements}
      </div>
    );
  },

  addMessage(msg) {
    // TODO: this.refs isn't being set - why?
    let $message = this.createMsgItem(msg);
    this.refs.panelContainer.appendChild($message);
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
    this.outputElement.dispose();
    this.messages = null;

    this.messageStream.removeListener('messageOutput', this.msgConsumer);
  }
}

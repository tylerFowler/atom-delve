/**
  DelveClient
  @description creates a singleton Delve client
**/
'use babel';

const DelveClient = require('delvejs');

var delveClient;

const connManager = {
  isConnected: false,
  connect: function connect(host, port) {
    delveClient = new DelveClient(host, port);
    return delveClient.establishSocketConn()
    .then(() => this.isConnected = true);
  },

  endConnection: function endConnection() {
    if (this.isConnected) {
      delveClient.endSession();
      delveClient = null;
    }
  }
};

export { connManager as DelveConnMgr };
export default delveClient;

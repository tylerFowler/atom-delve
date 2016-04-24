/**
  DelveClient
  @description creates a singleton Delve client
**/
'use babel';

const DelveClient = require('delvejs');

var delveClient;

const connManager = {
  connect: function connect(host, port) {
    delveClient = new DelveClient(host, port);
    return delveClient.establishSocketConn();
  },

  endConnection: function endConnection() {
    delveClient.endSession();
    delveClient = null;
  }
};

export { connManager as DelveConnMgr };
export default delveClient;

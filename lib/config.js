'use babel';
/**
  Config
  @description provides a single object to get configuration from
**/

const pkgName = 'atom-delve';

const getConf = key => atom.config.get(`${pkgName}.${key}`);

export default {
  host: getConf('serverHost'),
  port: getConf('serverPort'),
  logServerMessages: getConf('logServerMessages'),
  buildFlags: getConf('buildFlags'),
  usePendingOnJump: getConf('usePendingOnJump')
};

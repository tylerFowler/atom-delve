/**
  Config
  @description provides a single object to get configuration from
**/
'use babel';

const pkgName = 'atom-delve';

const getConf = key => atom.config.get(`${pkgName}.${key}`);

export default {
  host: getConf('serverHost'),
  port: getConf('serverPort'),
  buildFlags: getConf('buildFlags'),
  usePendingOnJump: getConf('usePendingOnJump')
};

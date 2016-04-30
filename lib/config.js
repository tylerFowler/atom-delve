'use babel';
/**
  Config
  @description provides a single object to get configuration from
**/

import { CompositeDisposable } from 'atom';

const rawConf = require('./config.json');

const pkgName = 'atom-delve';
const getConf = key =>
  atom.config.get(`${pkgName}.${key}`) || rawConf[key].default;

const getConf = key => atom.config.get(`${pkgName}.${key}`);

export default {
  host: getConf('serverHost'),
  port: getConf('serverPort'),
  logServerMessages: getConf('logServerMessages'),
  buildFlags: getConf('buildFlags'),
  usePendingOnJump: getConf('usePendingOnJump')
};

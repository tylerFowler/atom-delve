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

var disposables = new CompositeDisposable();

let conf = {
  serverHost: getConf('serverHost'),
  serverPort: getConf('serverPort'),
  logServerMessages: getConf('logServerMessages'),
  buildFlags: getConf('buildFlags'),
  usePendingOnJump: getConf('usePendingOnJump'),
  dispose: () => { if (disposables) disposables.dispose(); }
};

Object.keys(conf).forEach(configKey => {
  let disp = atom.config.observe(
    `${pkgName}.${configKey}`, val => conf[configKey] = val
  );

  disposables.add(disp);
});

export default conf;

/**
  Delve Server Manager
  @description Manages the Delve server process or references it if remote
**/
'use babel';

const ChildProc    = require('child-process');
const EventEmitter = require('events');
const Path         = require('path');

import { Config } from '../config.js';

const delveCommands = {
  debug: 'debug',
  test: 'test'
};

/**
  @class
  @name DelveServerMgr
  @desc Manages the Delve server process and lifecycle of the session
**/
export default class DelveServerMgr extends EventEmitter {
  constructor() {
    this.delveProc = null;
    this._pid = null;
    this.hasSessionStarted = false;
  }

  startDebugSession(packagePath, flags) {
    this.spawnProcess(delveCommands.debug, packagePath, flags);
  }

  startTestingSession(packagePath, flags) {
    this.spawnProcess(delveCommands.test, packagePath, flags);
  }

  /**
    @private
    @name #spawnProcess
    @desc creates a new delve process with the given command and registers
      our event handlers with it
    @param { String } command
    @param { String } cwd => will affect what package is being run against
    @param { String|String[] } buildFlags :optional
  **/
  spawnProcess(command, cwd, buildFlags) {
    let { host, port, logServerMessages } = Config;
    let args = [ command, '--headless', `--listen=${host}:${port}` ];

    if (buildFlags)
      if (Array.isArray(buildFlags))
        args.push(`--build-flags=${buildFlags.join(' ')}`);
      else
        args.push(`--build-flags="${buildFlags}"`);

    if (logServerMessages) args.push('--log');

    this.delveProc = ChildProc.spawn('dlv', args, { cwd: Path.resolve(cwd) });
    this._pid = this.delveProc.pid;
    this.isRemote = false;

    this.delveProc.on('data', data => {
      if (!this.hasSessionStarted) {
        console.debug('Received server start from Delve server', data);
        this.hasSessionStarted = true;
        return this.emit('serverStart');
      }

      console.debug('Received Delve data: ', data);
    });

    this.delveProc.on('error', err => this.emit('error', err));
    this.delveProc.on('disconnect', () => this.emit('disconnect'));

    if (logServerMessages)
      this.delveProc.on('message', msg => console.debug('Delve: ', msg));
  }
}

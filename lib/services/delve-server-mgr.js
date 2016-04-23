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
  @extends EventEmitter
  @name DelveServerMgr
  @desc Manages the Delve server process and lifecycle of the session
  @emits 'startServer' on delve server start
  @emits 'error' on delve server error or unexpected disconnect
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

  endSession() {
    this.hasSessionStarted = false;
    this.delveProc.kill();
    this._pid = null;
    this.delveProc = null;
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
    this.delveProc.on('disconnect', () => {
      // make sure we think we have a session before declaring an error
      if (this.hasSessionStarted)
        this.emit('error', new Error('Delve server disconnected'));
    });

    if (logServerMessages)
      this.delveProc.on('message', msg => console.debug('Delve: ', msg));
  }
}

'use babel';
/**
  Delve Server Manager
  @description Manages the Delve server process
**/

const ChildProc    = require('child_process');
const EventEmitter = require('events');
const Path         = require('path');

import Config from './config.js';

const delveCommands = {
  debug: 'debug',
  test: 'test'
};

/**
  @class
  @extends EventEmitter
  @name DelveServerMgr
  @desc Manages the Delve server process and lifecycle of the session
  @emits 'startServer' on delve server start, gives host & port of server
  @emits 'error' on delve server error or unexpected disconnect
**/
export default class DelveServerMgr extends EventEmitter {
  constructor() {
    super();
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
    if (this.delveProc) this.delveProc.kill();
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
    let { serverHost, serverPort, logServerMessages } = Config;
    let args = [command, '--headless', `--listen=${serverHost}:${serverPort}`];

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
        this.hasSessionStarted = true;
        return this.emit('serverStart', serverHost, serverPort);
      }

      console.debug('Received Delve data: ', data);
    });

    this.delveProc.on('error', err => this.emit('error', err));

    // Delve will output *all* of it's messages on stdout (even for error)
    // however log info messages will start with a timestamp => yyyy/mm/dd
    // so redirect if we find 4 numbers at the start (a year)
    let detectMsgTypeAndRedirect = d => {
      let msg = d.toString();
      if (msg.trimLeft().search(/^[0-9]{4}.*$/) < 0)
        return this.emit('error', d.toString());

      this.emit('delveMessage', d);
    };

    this.delveProc.stdout.on('data', detectMsgTypeAndRedirect);
    this.delveProc.stderr.on('data', detectMsgTypeAndRedirect);

    this.delveProc.on('disconnect', () => {
      // make sure we think we have a session before declaring an error
      if (this.hasSessionStarted)
        this.emit('error', new Error('Delve server disconnected'));
    });

    this.delveProc.on('close', exitCode =>
      this.emit(
        'fatal',
        new Error(`Delve exited with code ${exitCode}`)
      )
    );

    if (logServerMessages) {
      let logMsg = d => console.debug('Delve: ', d.toString());
      this.on('delveMessage', logMsg);

      this.delveProc.on('message', msg => console.debug('Delve: ', msg));
    }
  }
}

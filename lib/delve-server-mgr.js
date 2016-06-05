'use babel';
/**
  Delve Server Manager
  @description Manages the Delve server process
**/

const ChildProc    = require('child_process');
const EventEmitter = require('events');
const Path         = require('path');
const fs           = require('fs');

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
  @emits 'fatal' on an unrecoverable error
  @emits 'runtimeStdout' on stdout from the program
  @emits 'runtimeStderr' on stderr from the program
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

    if (this.delveProc) {
      this.delveProc.removeAllListeners();
      this.delveProc.kill();
    }

    this._pid = null;
    this.delveProc = null;
    this.removeAllListeners();

    fs.unlink(Path.resolve(this.projectDir, './debug'), () => {});
  }

  /**
    @private
    @name #spawnProcess
    @desc creates a new delve process with the given command and registers
      our event handlers with it
    @param {string} command
    @param {string} cwd => will affect what package is being run against
    @param {string|string[]} buildFlags :optional
  **/
  spawnProcess(command, cwd, buildFlags) {
    this.projectDir = cwd;

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

    this.delveProc.on('data', data =>
      console.debug('Received Delve data: ', data)
    );

    this.delveProc.on('error', err => this.emit('error', err));

    // Delve will output *all* of it's messages on stdout (even for error)
    // however log info messages will start with a timestamp => yyyy/mm/dd
    // so redirect if we find 4 numbers at the start (a year)
    let detectMsgTypeAndRedirect = d => {
      let msg = d.toString();
      if (msg.trim().search(/^[0-9]{4}.*$/) < 0)
        return this.emit('runtimeStderr', d.toString());

      // if this is the first message emit serverStart
      if (!this.hasSessionStarted) {
        this.hasSessionStarted = true;
        this.emit('serverStart', serverHost, serverPort);
      }

      this.emit('delveMessage', d);
    };

    // program output
    this.delveProc.stdout.on('data', d => this.emit('runtimeStdout', d));

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
      this.delveProc.on('message', logMsg);
    }
  }
}

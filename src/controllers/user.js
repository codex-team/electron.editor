'use strict';
let {ipcMain} = require('electron');

/**
 * User controller.
 * Works with events:
 *  - user - get
 */
class UserController {

  /**
   * Bind event handlers
   *
   * @constructor
   */
  constructor() {
    ipcMain.on('user - get', (event) => {
      this.get(event);
    });

    ipcMain.on('user - sync', (event) => {
      this.sync(event);
    });
  }

  /**
   *
   * @param event
   */
  get(event) {
    event.returnValue = global.user;
  }

  /**
   * Perform synchronisation by request from the Client
   *
   * @param {GlobalEvent} event
   */
  async sync(event) {
    try {
      let updatesFromCloud = await global.app.cloudSyncObserver.sync({direction: 'both'});

      event.sender.send('sync finished', {result : true, data: updatesFromCloud});
    } catch(e) {
      event.sender.send('sync finished', {result : false, error: e});
      global.catchException(e);
    }
  }
}

module.exports = UserController;

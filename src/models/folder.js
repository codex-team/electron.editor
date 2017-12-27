'use strict';

const db = require('../utils/database');

/**
 * @typedef {Object} FolderData
 * @property {String|null} id          - Folder's id
 * @property {String|null} _id         - Folder's Database id
 * @property {String|null} title       - Folder's title
 * @property {Number} dtModify    - Last modification timestamp
 * @property {String} ownerId     - Folder owner's id
 * @property {Array} notes        - Folder's Notes list
 */

/**
 * @class Folder
 * @classdesc Folder's model type
 *
 * @typedef {Folder} Folder
 * @property {String} id
 * @property {String|null} title
 * @property {Number} dtModify
 * @property {String} ownerId
 * @property {Note[]} notes
 *
 */
module.exports = class Folder {

  /**
   * Initialize params for the API
   */
  constructor({_id, id, title, ownerId, dtModify, notes} = {}) {
    this.id = id || _id ||null;
    this.title = title || null;
    this.dtModify = dtModify || null;
    this.ownerId = ownerId || null;
    this.notes = notes || [];
  }

  /**
   * Folder data getter
   * @return {FolderData}
   */
  get data() {
    let folderData = {
      title: this.title,
      ownerId: this.ownerId,
      dtModify: this.dtModify,
      notes: this.notes
    };

    if (this.id){
      folderData.id = this.id;
    }

    return folderData;
  }

  /**
   * Folder data setter
   * @param {FolderData} folderData
   */
  set data(folderData) {
    this.id = folderData.id || folderData._id || null;
    this.title = folderData.title || null;
    this.dtModify = folderData.dtModify || null;
    this.ownerId = folderData.ownerId || null;
    this.notes = folderData.notes || [];
  }

  /**
   * Saves new Folder into the Database.
   * Update ot Insert scheme
   * @returns {Promise.<FolderData>}
   */
  async save() {
    let query = {
          _id : this.id
        },
        data = this.data,
        options = {
          upsert: true,
          returnUpdatedDocs: true
        };

    /**
     * On sync, we need to save given id as _id in the DB.
     */
    if (this.id){
      data = Object.assign(data, {_id: this.id});
    }

    let savedFolder = await db.update(db.DIRECTORY, query, data, options);

    /**
     * Renew Model id with the actual value
     */
    if (savedFolder._id){
      this.id = savedFolder._id;
    }

    /**
     * @todo Sync with API
     */

    return savedFolder.affectedDocuments;
  }


  /**
   * Delete Folder from the Database
   * @returns {Boolean}
   */
  async delete() {
    /**
     * 1. Remove all Notes in the Folder
     */
    await db.remove(db.NOTES, {folderId: this.id}, {});

    /**
     * 2. Remove Folder
     */
    let deleteFolderResult = await db.remove(db.DIRECTORY, {_id: this.id}, {});

    /**
     * 3. Send Folder Mutation to the API
     * @todo Sent Folder mutation to the API
     */

    return !!deleteFolderResult;
  }

  /**
   * Get directory by ID
   * @param {String} id - directory ID
   * @returns {FolderData} - Folder's data
   */
  async get(id) {
    let folder = await db.findOne(db.DIRECTORY, {_id: id});

    if (folder) {
      this.data = folder;
      return this.data;
    } else {
      return false;
    }
  }

  /**
   * Invite a Collaborator
   * @param {String} email - Collaborator's email
   * @returns {Boolean}
   */
  async addCollaborator(email) {

    /**
     * @todo Send Collaborator Mutation to the API
     */
    console.log('Collaborator will be added with email: ', email);

    return true;
  }

  /**
   * Get updates action. Make a packet of data changed from last sync date specified.
   */
  async getUpdates(dt_update) {
    try {
      let newFolders = await db.find(db.DIRECTORY, {dt_update: { $gt: dt_update }});

      return newFolders;
    } catch (err) {
      console.log('getUpdates folders error: ', err);
      return false;
    }
  }
};
const db = require('../utils/database');
const Time = require('../utils/time');

/**
 * @typedef {Object} CollaboratorData
 * @property {String} _id           — Collaborator's id
 * @property {String} email         — Collaborator's email
 * @property {String} token         — Collaborator's invitation token
 * @property {String} folderId      - Shared Folder's id
 * @property {String} ownerId       - Shared Folder owner's id
 * @property {Number} dtInvite      - timestamp of invitation
 */

/**
 * Collaborator model.
 */
class Collaborator {

  /**
   * Model constructor
   * @constructor
   *
   * @param {CollaboratorData} collaboratorData
   */
  constructor(collaboratorData = {}) {
    this.data = collaboratorData;
  }

  /**
   * Save Collaborator's data to the database
   *
   * @returns {Promise.<void>}
   */
  async save() {
    let data = this.data;

    /**
     * If there is no _id field, it's Collaborator created on the client side
     * ----> Just insert it to the database
     */
    if (!this._id) {
      delete data._id;
      let insertedRow = await db.insert(db.COLLABORATORS, data);

      this._id = insertedRow._id;

      return;
    }

    /**
     * If Collaborator with given _id field doesnt exist in the database,
     * it's Collaborator got from the Cloud
     * ----> Insert it to the database with given _id
     */
    let collaboratorFromDB = await db.findOne(db.COLLABORATORS, {_id: this._id});

    if (!collaboratorFromDB) {
      this.data = await db.insert(db.COLLABORATORS, data);
      return;
    }

    /**
     * Otherwise, it's Collaborator with updated data got from the Cloud
     * ----> Update it in the database
     */
    delete data._id;
    await db.update(db.COLLABORATORS, {_id: this._id}, {$set: data});
  }

    /**
     * Set CollaboratorData {@see CollaboratorData}
     *
     * @param _id
     * @param token
     * @param email
     * @param ownerId
     * @param folderId
     * @param dtInvite
     */
  set data({_id, token, email, ownerId, folderId, dtInvite}) {
    this._id = _id || this._id || null;
    this.token = token || this.token || null;
    this.email = email || this.email || null;
    this.ownerId = ownerId || this.ownerId || null;
    this.folderId = folderId || this.folderId || null;
    this.dtInvite = dtInvite || this.dtInvite || Time.now;
  }

    /**
     * Get CollaboratorData
     *
     * @returns {CollaboratorData}
     */
  get data() {
    return {
      _id: this._id,
      token: this.token,
      email: this.email,
      ownerId: this.ownerId,
      folderId: this.folderId,
      dtInvite: this.dtInvite
    };
  }

  /**
   * Get Collaborator by email
   *
   * @param folderId
   * @param email
   * @returns {Promise.<CollaboratorData>}
   */
  static async findByEmail(folderId, email) {
    return await db.findOne(db.COLLABORATORS, {folderId, email});
  }

  /**
   * Prepare updates for target time
   *
   * @param lastSyncTimestamp
   *
   * @returns {Promise.<CollaboratorData[]>}
   */
  static async prepareUpdates(lastSyncTimestamp) {
    let notSyncedItems = await db.find(db.COLLABORATORS, {
      dtInvite: {$gt: lastSyncTimestamp}
    });

    return notSyncedItems;
  }

}

module.exports = Collaborator;
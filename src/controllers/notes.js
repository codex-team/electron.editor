'use strict';
let {ipcMain} = require('electron');

const Note = require('../models/note');
const Folder = require('../models/folder');
const NotesList = require('../models/notesList');

/**
 * Notes controller.
 * Works with events:
 *  - note - save
 *  - notes list - load (in specified Folder)
 *  - get note
 */
class NotesController {

  /**
   * Setup event handlers
   */
  constructor() {

    ipcMain.on('note - save', (event, {note}) => {
      this.saveNote(note, event);
    });

    ipcMain.on('notes list - load', (event, folderId) => {
      this.loadNotesList(folderId, event);
    });

    ipcMain.on('get note', (event, {id}) => {
      this.getNote(id, event);
    });

    ipcMain.on('delete note', (event, {id}) => {
      this.deleteNote(id, event);
    });
  }

  /**
   * Save Note and return result to the event emitter.
   *
   * @param {object} noteData
   * @param {object|null} noteData.folderId      - in which Folder Note was created. Null for the Root Folder.
   * @param {string} noteData.title              - Note's title
   * @param {object} noteData.data               - Note data got from the CodeX Editor
   * @param {string|null} noteData.data.id       - On editing, stores Note's id
   * @param {string} noteData.data.items         - Note's content
   * @param {number} noteData.data.time          - Note's saving time
   * @param {string} noteData.data.version       - used CodeX Editor version
   *
   * @param {GlobalEvent} event - {@link https://electronjs.org/docs/api/ipc-main#event-object}
   *
   * Send 'note saved' action to the event emitter with the saved Note data.
   * @returns {Promise.<void>}
   */
  async saveNote(noteData, event) {
    try {
      let note = new Note({
        title: noteData.title,
        editorVersion: noteData.data.version,
        dtModify: +new Date(),
        authorId: global.user ? global.user.id : null,
        folderId: noteData.folderId,
        content: noteData.data.items,
        _id: noteData.data.id || null,
      });
      let newNote = await note.save();

      console.log('Note saving result: ', newNote);

      if (newNote) {
        event.sender.send('note saved', {
          note: newNote,
          isRootFolder: !noteData.folderId
        });
      }
    } catch (err) {
      console.log('Note saving failed because of ', err);
    }
  }

  /**
   * Load Notes from Folder with the specified id.
   * Send 'update notes list' action to the event emitter with Notes list.
   *
   * @param {string} folderId - Folder's id
   * @param {GlobalEvent} event
   * @returns {Promise.<Object|boolean>}
   */
  async loadNotesList(folderId, event) {
    try {
      let list = new NotesList({
        folderId
      });
      let notesInFolder = await list.get();

      let retunValue = {
        notes: notesInFolder,
        isRootFolder: !folderId
      };

      event.returnValue = retunValue;

      event.sender.send('update notes list', retunValue);
    } catch (err) {
      console.log('Notes list loading failed because of ', err);
      event.returnValue = false;
    }
  }

  /**
   * Get Note with the ID specified
   * @param {string} noteId  - Note's id
   * @param {GlobalEvent} event
   * @returns {Promise.<boolean>}
   */
  async getNote(noteId, event) {
    try {
      let note = new Note({_id : noteId});

      let noteData = await note.get();
      event.returnValue = noteData;
    } catch (err) {
      console.log('Note\'s data loading failed because of ', err);
      event.returnValue = false;
    }
  }

  /**
   * Delete Note with specified ID
   * @param {string} noteId
   * @param {GlobalEvent} event
   * @returns {Promise.<boolean>}
   */
  async deleteNote(noteId, event) {
    try {
      let note = new Note({
        _id: noteId
      });
      let result = await note.delete();

      event.returnValue = !!result;
    } catch (err) {
      console.log('Note failed because of ', err);
      event.returnValue = false;
    }
  }
}

module.exports = NotesController;
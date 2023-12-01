const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, '../../credentials/ace-hotel-app-7faad1bbd30a.json'), // Replace with your credentials file path
  projectId: 'ace-hotel-app', // Replace with your Google Cloud project ID
});

module.exports = storage;

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
var exec = require('child_process').exec;
const update = catchAsync(async (req, res) => {
  // Optional: Validate the secret
  if (config.env === 'production') {
    return res.status(403).send('Forbidden');
  }

  // Perform git fetch and restart the Node app
  exec('cd ~/AceHotel-Backend && git fetch && git reset --hard origin/main   && yarn start', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    res.status(200).send('Successfully fetched and restarted');
  });
});

module.exports = {
  update,
};

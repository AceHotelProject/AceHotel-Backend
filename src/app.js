const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const mqtt = require('mqtt');
const { exec } = require('child_process');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const logger = require('./config/logger');

const app = express();
// See commit head

const getCurrentGitCommit = () => {
  return new Promise((resolve, reject) => {
    exec('git rev-parse HEAD', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

app.get('/', async (req, res) => {
  try {
    const commitHash = await getCurrentGitCommit();
    res.json({
      message: `🦄🌈✨👋🌎🌍🌏  Current Git HEAD: ${commitHash}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Git HEAD commit' });
  }
});

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

const host = '35.209.47.216';
const port = '1883';

const clientId = `backend1`;

// const timeOutValue = 3000;
const connectUrl = `mqtt://${host}:${port}`;
const topicReader = 'mqtt-integration/Reader/';
const topicInventory = 'mqtt-integration/Inventory/+/add';
const { readerService } = require('./services');

// mosquitto_pub -d -q 1 -h 34.66.84.55 -p 1883 -t mqtt-integration/Reader/ACE-001/rx -i 'backend3' -u 'backend3' -P 'an1m3w1bu' -c -m 'Hello World'
const mqttClient = mqtt.connect(connectUrl, {
  clientId,

  clean: true,
  connectTimeout: 4000,
  username: 'backend1',
  password: 'an1m3w1bu',
  reconnectPeriod: 1000,
});
// Connect to the MQTT broker
mqttClient.on('connect', function () {
  logger.info('Connected to MQTT broker');
  mqttClient.subscribe(`${topicReader}+`);
  mqttClient.subscribe(topicInventory);
});
mqttClient.on('message', async (topic, message) => {
  let readerName;
  try {
    // message is a Buffer
    // let strTopic = topic.toString();
    const strMessage = message
      .toString()
      .replace(/\r?\n|\r/, '')
      .trim();
    // console.log('msg: ', strMessage);
    // let objMessage = JSON.parse(strMessage);
    // Check if the topic starts with the prefix and then extract the specific part

    if (topic.startsWith(topicReader)) {
      readerName = topic.slice(topicReader.length);
      const reader = await readerService.getReaderByName(readerName);
      // console.log(reader);
      if (!reader) {
        throw new Error('Reader Not Found');
      }
      // console.log(readerName, strMessage);
      const messageObj = JSON.parse(strMessage);
      if (!messageObj) {
        throw new Error('Error Processing Reader, Check Synthax');
      }
      // console.log(topic, strMessage);
      if (!messageObj.method) {
        // console.log('not a method', messageObj);
      }
      if (messageObj.method && messageObj.method === 'getData') {
        const pubMessage = {
          name: readerName,
          data: {
            power_gain: reader.power_gain,
            read_interval: reader.read_interval,
          },
          status: 1,
        };
        // console.log('success message: ', message);

        mqttClient.publish(`${topicReader + readerName}/rx`, JSON.stringify(pubMessage), {
          qos: 0,
          retain: false,
        });
      } else if (messageObj.method && messageObj.params && messageObj.method === 'updateData') {
        // console.log(messageObj.params);
        const data = messageObj.params;
        // Convert string values to numbers
        Object.keys(data).forEach((key) => {
          if (!Number.isNaN(data[key])) {
            data[key] = Number(data[key]);
          }
        });

        // console.log(data);
        Object.assign(reader, data);
        await reader.save();
        const pubMessage = {
          name: readerName,
          data: {
            power_gain: reader.power_gain,
            read_interval: reader.read_interval,
          },
          status: 1,
        };
        // console.log('success message: ', message);

        mqttClient.publish(`${topicReader + readerName}/rx`, JSON.stringify(pubMessage), {
          qos: 0,
          retain: false,
        });
      }
    }
  } catch (error) {
    if (error.message) {
      const pubMessage = {
        name: readerName,
        data: error.message,
        status: 0,
      };
      // console.log('error message: ', message);
      mqttClient.publish(`${topicReader + readerName}/rx`, JSON.stringify(pubMessage), {
        qos: 0,
        retain: false,
      });
    }
  }
});
// MQTT middleware for publishing and subscribing
app.use(function (req, res, next) {
  // Publish messages
  req.mqttPublish = function (topic, message) {
    mqttClient.publish(topic, message, {
      qos: 0,
      retain: false,
    });
  };

  // Subscribe to topic
  req.mqttWaitMessage = function (topic, timeout = 6000) {
    return new Promise((resolve) => {
      let timeoutHandle;

      const onMessage = (t, m) => {
        if (t === topic) {
          clearTimeout(timeoutHandle);
          mqttClient.removeListener('message', onMessage);
          resolve(m.toString());
        }
      };

      // mqttClient.subscribe(topic);
      mqttClient.on('message', onMessage);

      timeoutHandle = setTimeout(() => {
        mqttClient.removeListener('message', onMessage);
        next(new ApiError(httpStatus.REQUEST_TIMEOUT, 'MQTT message timeout'));
      }, timeout);
    });
  };

  // Subscribe to topic
  req.mqttUnsubscribe = function (topic) {
    mqttClient.unsubscribe(topic);
  };
  next();
});
// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);
// health check

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;

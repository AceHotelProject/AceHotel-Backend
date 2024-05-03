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

const host = config.mqtt.url;
const port = '1883';

// eslint-disable-next-line prefer-destructuring
const clientId = `${config.mqtt.clientId}`;

// const timeOutValue = 3000;
const connectUrl = `mqtt://${host}:${port}`;
// const topicInventoryRx
const { readerService, inventoryService, tagService } = require('./services');
// const { tagService } = require('./services');
// // mosquitto_pub -d -q 1 -h 34.66.84.55 -p 1883 -t mqtt-integration/Reader/ACE-001/rx -i 'backend3' -u 'backend3' -P 'an1m3w1bu' -c -m 'Hello World'
const mqttClient = mqtt.connect(connectUrl, {
  clientId,

  clean: true,
  connectTimeout: 4000,
  username: `${config.mqtt.userName}`,
  password: `${config.mqtt.pass}`,
  reconnectPeriod: 1000,
});
// Connect to the MQTT broker

mqttClient.on('connect', function () {
  logger.info('Connected to MQTT broker');
  mqttClient.subscribe(`Inventory/+/tx`);
  mqttClient.subscribe(`Reader/+`);
});
mqttClient.on('message', async (topic, message) => {
  let readerName;
  const strMessage = message
    .toString()
    .replace(/\r?\n|\r/, '')
    .trim();
  try {
    if (topic.startsWith('Inventory/')) {
      const topicPart = topic.split('/')[1];
      readerName = topicPart;
      const reader = await readerService.getReaderByName(readerName);
      if (!reader) {
        throw new Error('Reader Not Found');
      }
      const messageObj = JSON.parse(strMessage);

      if (!messageObj) {
        throw new Error('Error Processing Reader, Check Synthax');
      }
      if (!messageObj.method) {
        throw new Error('Not a method');
      } else if (messageObj.method === 'updateTag') {
        const listOfTid = messageObj.tid;
        const togglePromises = listOfTid.map((tid) => tagService.toggleTagStatus(tid));
        const results = await Promise.all(togglePromises);
        const inventoryCount = {};
        results.forEach((result) => {
          console.log(result);
          if (result) {
            const { inventoryId, increment } = result;
            const inventoryIdStr = inventoryId.toString();

            // Initialize the count if not present
            if (!inventoryCount[inventoryIdStr]) {
              inventoryCount[inventoryIdStr] = 0;
            }

            // Update the count based on the increment (-1 for OUT, 1 for IN)
            inventoryCount[inventoryIdStr] += increment;
          }
        });
        inventoryService.updateInventoryByReader(inventoryCount);
        console.log(inventoryCount);
        mqttClient.publish('Mqtt/debug', `Success: Update Tag. Updated ${Object.values(inventoryCount).length} data`, {
          qos: 0,
          retain: false,
        });
      } else if (messageObj.method === 'getData') {
        const pubMessage = {
          method: 'getData',
          data: {
            power_gain: reader.power_gain,
            read_interval: reader.read_interval,
          },
        };
        // console.log('success message: ', message);

        mqttClient.publish(`Inventory/${readerName}/rx`, JSON.stringify(pubMessage), {
          qos: 0,
          retain: false,
        });
      }
    } else {
      throw new Error('Topic not found');
    }
  } catch (error) {
    if (error.message) {
      const pubMessage = {
        name: readerName,
        data: error.message,
        status: 0,
      };
      // console.log('error message: ', message);
      mqttClient.publish('Mqtt/debug', JSON.stringify(pubMessage), {
        qos: 0,
        retain: false,
      });
    }
  }
});
// else if (topic.startsWith('Reader/')) {
//       const topicPart = topic.split('/')[1];
//       readerName = topicPart;
//       const reader = await readerService.getReaderByName(readerName);
//       if (!reader) {
//         throw new Error('Reader Not Found');
//       }
//       const messageObj = JSON.parse(strMessage);

//       if (!messageObj) {
//         throw new Error('Error Processing Reader, Check Synthax');
//       }
//       if (!messageObj.method) {
//         throw new Error('Not a method');
//       } else if (messageObj.method === 'getData') {
//         const pubMessage = {
//           method: 'response',
//           name: readerName,
//           data: {
//             power_gain: reader.power_gain,
//             read_interval: reader.read_interval,
//           },
//           status: 1,
//         };
//         // console.log('success message: ', message);

//         mqttClient.publish(`Reader/${readerName}`, JSON.stringify(pubMessage), {
//           qos: 0,
//           retain: false,
//         });
//       }
//     }
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
  req.mqttWaitMessage = function (topic, timeout = 15000) {
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

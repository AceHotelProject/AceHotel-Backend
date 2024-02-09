const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();
// See commit head

const { exec } = require('child_process');

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
const mqtt = require('mqtt');
const host = '35.202.12.122';
const port = '1883';

const clientId = `backend1`;

const topic = '/nodejs/mqtt/rx';
const timeOutValue = 3000;
const connectUrl = `mqtt://${host}:${port}`;
//mosquitto_pub -d -q 1 -h 35.202.12.122 -p 1883 -t tbmq/demo/topic -i 'backend3' -u 'backend3' -P 'an1m3w1bu' -c -m 'Hello World'
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
  console.log('Connected to MQTT broker');
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
  req.mqttSubscribe = function (topic, timeout = 3000) {
    return new Promise((resolve, reject) => {
      let timeoutHandle;

      const onMessage = (t, m) => {
        if (t === topic) {
          clearTimeout(timeoutHandle);
          mqttClient.removeListener('message', onMessage);
          resolve(m.toString());
        }
      };

      mqttClient.subscribe(topic);
      mqttClient.on('message', onMessage);

      timeoutHandle = setTimeout(() => {
        mqttClient.removeListener('message', onMessage);
        next(new ApiError(httpStatus.REQUEST_TIMEOUT, 'MQTT message timeout'));
      }, timeout);
    });
  };

  // Subscribe to topic
  req.mqttUnsubscribe = function (topic, callback) {
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

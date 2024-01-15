// // Handle MQTT
// const mqtt = require('mqtt');
// const host = '35.202.12.122';
// const port = '1883';
// const clientId = `backend-client`;

// const connectUrl = `mqtt://${host}:${port}`;

// const client = mqtt.connect(connectUrl, {
//   clientId,
//   clean: true,
//   connectTimeout: 4000,
//   username: 'backend-client',
//   password: 'an1m3w1bu',
//   reconnectPeriod: 1000,
// });

// const topic = '/nodejs/mqtt/rx';

// // Flag to check subscription status
// let isSubscribed = false;

// client.on('connect', () => {
//   console.log('Connected');
//   // Subscribe to the topic only if not already subscribed
//   if (!isSubscribed) {
//     client.subscribe(topic, () => {
//       console.log(`Subscribed to topic '${topic}'`);
//       isSubscribed = true; // Set the flag to true after subscribing
//     });
//   }
// });

// module.exports = client;

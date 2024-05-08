// let strTopic = topic.toString();
const topicReader = 'mqtt-integration/Reader/';
const topicInventoryAdd = 'Inventory/+/add';
const topicInventoryTag = 'Inventory/+/tag';
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
} else if (topic.startsWith('mqtt-integration/Inventory/') && topic.endsWith('/tag')) {
  const topicRegex = /^mqtt-integration\/Inventory\/([^]+)\/tag$/;

  const match = topic.match(topicRegex)[1];
  readerName = match; // This is the captured READER_NAME
  const messageObj = JSON.parse(strMessage);

  if (!messageObj) {
    throw new Error('Error Processing Reader, Check Synthax');
  }
  if (messageObj.status === '1') {
    if (messageObj.tid) {
      const listOfTid = messageObj.tid;
      const togglePromises = listOfTid.map((tid) => tagService.toggleTagStatus(tid));
      const results = await Promise.all(togglePromises);
      const inventoryCount = {};

      results.forEach((result) => {
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
    }
  }
}

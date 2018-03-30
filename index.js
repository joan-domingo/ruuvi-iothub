'use strict';

const ruuvi = require('node-ruuvitag');

const Client = require('azure-iot-device').Client;
const ConnectionString = require('azure-iot-device').ConnectionString;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;

var sendingMessage = true;
var messageId = 0;
var client;

function sendMessage(data) {
	if (!sendingMessage) { return; }
 	messageId++;
	var message = new Message(data);
	client.sendEvent(message, (err) => {
		if (err) {
  		console.error('Failed to send message to Azure IoT Hub');
		}
  });
}

function initClient(connectionStringParam) {
  var connectionString = ConnectionString.parse(connectionStringParam);
  // fromConnectionString must specify a transport constructor, coming from any transport package.
  client = Client.fromConnectionString(connectionStringParam, Protocol);
  return client;
}

(function (connectionString) {
  // create a client
  // read out the connectionString from process environment
  connectionString = connectionString || process.env['AzureIoTHubDeviceConnectionString'];
  client = initClient(connectionString);

  client.open((err) => {
    if (err) {
      console.error('[IoT hub Client] Connect error: ' + err.message);
      return;
    }
  	ruuvi.on('found', tag => {
  		console.log('Found RuuviTag, id: ' + tag.id);
  		tag.on('updated', data => {
  			var azureData = {
  				...data,
  				'id': tag.id,
  			};
  			var azureDataJson = JSON.stringify(azureData);
        // console.log(azureDataJson)
  			sendMessage(azureDataJson);
  	  });
  	});
  });
})(process.argv[2]);

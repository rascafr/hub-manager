# hub-manager

## Overview

hub-manager is a simple interface that allows to deploy a MQTT server (broker) in a Node.js environment.

It is based on Mosca for the broker setup and publish / subscribe mechanism.

Please note this module might be (for sure) full of bugs, fell free to fix / post the issues / add pull requests :)

## Usage examples

Please note that there is also a `test.js` file with a quick example inside.

### Basic configuration

```javascript
// Include the manager
var HubManager = require('./path/to/hub-manager');

// Create an instance that will listen on the port 1883
// 27017 is your mongodb port
var hm = new HubManager(1883, 27017);

/**
 * Authentication callback
 * @return true to accept the client connection, false otherwise
 */
var auth_conn = function (client, username, password) { 
  // check the database...
  // if (client == 'guy') ...
  return true; 
}

/**
 * Subscription accept callback
 * @return true to allow the client to subscribe on this topic, false otherwise
 */
var auth_subs = function (client, topic) { 
  return true; 
}

/**
 * Publish accept callback
 * @return true to allow the client to publish to a topic, false otherwise
 */
var auth_publ = function (client, topic, payload) { 
  return true 
}

// Set the connection / sub / pub accept callbacks
hm.authorizeClientConnection(auth_conn);
hm.authorizeClientSubscription(auth_subs);
hm.authorizeClientPublish(auth_publ);

// Add a ready callback
hm.onServerReady(function() {
  console.log('Server is ready yeah');
})

// Setup the MQTT broker
hm.setup();

```
If the `authorize` callback are not defined in your code, the client won't be able to connect / publish / subscribe (refused, default).

### Listen to events

You can listen to every MQTT event, including `CONNECT`, `SUBSCRIBE`, `UNSUBSCRIBE`, `PUBLISH`, `DISCONNECT` (check MQTT specifications [here](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html))

```javascript

hm.onClientConnected(function (client) { ... });

hm.onClientSubscribed(function (client, topic) { ... });

hm.onClientUnsubscribed(function (client, topic) { ... });

hm.onClientPublished(function (client, topic, payload) { ... });

hm.onClientDisconnected(function (client) { ... });

```
### Publishing data

The `payload` parameter can be a `Buffer` or a `String` so you can send (and receive!) text and data bytes as well.

```javascript

// Publish data with default settings (QoS 0, no retain)
hm.publishSimplePacket('hi there', '/some/topic');

// Publish data with more settings
var msg_QoS = 1;
var msg_retain = true;
hm.publishComplexPacket('DEADBEEF', '/aa/bb', msg_QoS, msg_retain);

```

### Extra

You can get the connected clients map with the associated function. Each client unique ID can be accessed as well.

```javascript
var mqtt_clients = hm.clients();
for (var key in server.clients) {
  console.log('Client ID: ' + key);
}
```

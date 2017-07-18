// Include the manager
var HubManager = require('./index.js');

// Create an instance that will listen on the port 1883
var hm = new HubManager(1883, 27017);

/**
 * Authentication callback
 * @return true to accept the client connection, false otherwise
 */
var auth_conn = function (client, username, password) { 
  // check the database...
  // if (client == 'guy') ...
  // password.toString() might be needed as well if compared to a db result
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

// ...
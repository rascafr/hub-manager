// Include the manager
var HubManager = require('./index.js');

// Create an instance that will listen on the port 1883
var hm = new HubManager(1883, 27017);

console.log(hm);

var auth_conn = function (client, username, password) { 
	return true; 
}

var auth_subs = function (client, topic) { 
	return true; 
}

var auth_publ = function (client, topic, payload) { 
	return true 
}

// add a connection auth callback
hm.authorizeClientConnection(auth_conn);
hm.authorizeClientSubscription(auth_subs);
hm.authorizeClientPublish(auth_publ);

// add a ready callback
hm.onServerReady(function() {
	console.log('Server is ready :)');
})

// Setup the manager
hm.setup();

// ...
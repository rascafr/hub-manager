// Include the manager
var HubManager = require('./index.js');

// Create an instance that will listen on the port 1883
var hm = new HubManager(1883, 27017);

console.log(hm);

// add a connection auth callback
hm.authorizeClientConnection(
	function (client, username, password) { 
		return true; 
	}
);
hm.authorizeClientSubscription(
	function (client, topic) { 
		return true; 
	}
);
hm.authorizeClientPublish(
	function (client, topic, payload) { 
		return true 
	}
);

// Setup the manager
hm.setup();

// ...
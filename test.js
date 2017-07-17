// Include the manager
var HubManager = require('./index.js');

// Create an instance that will listen on the port 1883
var hm = new HubManager(1883, 27017);

// Setup the manager
hm.setup();
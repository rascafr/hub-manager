'use strict';

const mqttBroker = require('mosca');

/**
 * This class represents the Hub Manager MQTT module connection
 * This module will handle the remote connections between the MQTT broker on the server and the MQTT clients (hubs)
 * 
 * Minimum setup exemple:
 *  
 *  // Init the module
 *  var hm = new HubManager(1883, 27017);
 * 
 *  // Set some control callbacks
 *  // Here we only allow 'truc' client with a predefined password 
 *  hm.authorizeClientConnection(function (client, username, password) {
 *      if (username == 'truc' && password == 'wtl en pls') return true
 *      else return false;
 *  });
 * 
 *  // Setup the server
 *  hm.setup();
 * 
 *  // Done!
 * 
 * @class HubManager
 * @version 0.0001b
 * @author Francois Leparoux (francois.leparoux@gmail.com)
 * @copyright GiveMeSomeMoney Corporation (c)
 */
class HubManager {

    /**
     * Creates the Hub Manager instance
     * @param mqttPort The MQTT port that the broker will listen on
     * @param mongodbPort The mongoDB port that will be used for the connection with the local database
     * @memberof HubManager
     */
    constructor(mqttPort, mongodbPort) {

        // module settings
        this.mqttPort = mqttPort;
        this.mongodbPort = mongodbPort;

        // server not configured yet
        this.mqttServer = null;

        // default callback values
        this.authConnCallback = null;
        this.authPubCallback = null;
        this.authSubCallback = null;
        this.connCallback = null;
        this.subCallback = null;
        this.unsubCallback = null;
        this.pubCallback = null;
        this.discCallback = null;

        // default settings values
        this.ttlSub = 3600 * 2 * 1000;      // 2 hours in ms
        this.ttlPacket = 3600 * 2 * 1000;   // 2 hours in ms
        this.mongoPersistanceName = "hub_manager_broker_persistance";
        this.logName = "hub_manager_log";
        this.logLevel = 40;;
    }

    /**
     * Sets the authorize callback that wil be called when a client tries to authenticate
     * @param callback the callback function
     */
    set authorizeClientConnection(callback) {
        this.authConnCallback = callback;
    }

    /**
    * Sets the authorize callback that wil be called when a client tries to publish to a topic
    * @param callback the callback function
    */
    set authorizeClientPublish(callback) {
        this.authPubCallback = callback;
    }

    /**
    * Sets the authorize callback that wil be called when a client tries to subscribe to a topic
    * @param callback the callback function
    */
    set authorizeClientSubscription(callback) {
        this.authSubCallback = callback;
    }

    /**
    * Sets the callback that wil be called when a client is connected to the broker
    * @param callback the callback function
    */
    set onClientConnected(callback) {
        this.connCallback = callback;
    }

    /**
    * Sets the callback that wil be called when a client has subscribed to a topic
    * @param callback the callback function
    */
    set onClientSubscribed(callback) {
        this.subCallback = callback;
    }

    /**
    * Sets the callback that wil be called when a client has unsubscribed to a topic
    * @param callback the callback function
    */
    set onClientUnsubscribed(callback) {
        this.unsubCallback = callback;
    }

    /**
    * Sets the callback that wil be called when a client has published data to a topic
    * @param callback the callback function
    */
    set onClientPublished(callback) {
        this.pubCallback = callback;
    }

    /**
    * Sets the callback that wil be called when a client has disconnected from the borker
    * @param callback the callback function
    */
    set onClientDisconnected(callback) {
        this.discCallback = callback;
    }

    /**
     * Returns the list of the broker's connected clients
     * @readonly
     * @memberof HubManager
     */
    get clients() {
        return this.mqttServer == null ? null : this.mqttServer.clients;
    }

    /**
     * Publish some data (a packet) to clients subscribed to a defined topic
     * 
     * @param {any} data 
     * @param {string} topic 
     * @memberof HubManager
     */
    publishSimplePacket(data, topic) {
        this.publishComplexPacket(data, topic, 0, false);
    }

    /**
     * Publish some data (a packet) to clients subscribed to a defined topic
     * Same as publishSimplePacket but with QoS and retin flag management
     * 
     * @param {any} data 
     * @param {string} topic 
     * @memberof HubManager
     */
    publishComplexPacket(data, topic, qos, retain) {
        var message = {
            topic: topic,
            payload: data, // or a Buffer
            qos: qos, // 0, 1, or 2
            retain: retain // true or false
        };

        this.mqttServer.publish(message, /*client,*/ function () {
            console.log('[HubManager MQTT] Publish done (to ' + topic + ')');
        });
    }

    /**
     * Setup the Hub Manager module, must be called after the constructor and the callback setters
     */
    setup() {

        // create the settings object
        var settings = {
            port: this.mqttPort,
            backend: {
                type: 'mongo',
                url: 'mongodb://localhost:' + this.mongodbPort + '/mqtt',
                pubsubCollection: this.mongoPersistanceName,
                mongo: {}
            },
            logger: {
                name: this.logName,
                level: this.logLevel,
            }
        };

        // create the instance
        this.mqttServer = new mqttBroker.Server(settings);

        var self = this;

        var moscaPersistenceDB = new mqttBroker.persistence.Mongo({
            url: 'mongodb://localhost:' + this.mongodbPort + '/moscaPersistence',
            ttl: {
                subscriptions: this.ttlSub,
                packets: this.ttlPacket
            }
        },
            function () {
                console.log('[HubManager] server persistence is ready on port ' + self.mongodbPort)
            }
        );
        moscaPersistenceDB.wire(this.mqttServer);
        this.mqttServer.on('ready', function(){
            __broker_setup(self)
        }); // engage the broker setup procedure
    }

    /**
     * Private function, fired when the mqtt server is ready
     */
    __broker_setup(self) {
        console.log(self);
        /*this.mqttServer.authenticate =               this.__broker_auth;
        this.mqttServer.authorizePublish =           this.__broker_allow_sub;
        this.mqttServer.authorizeSubscribe =         this.__broker_allow_sub;
        this.mqttServer.on('clientConnected',        this.__broker_connected);
        this.mqttServer.on('published',              this.__broker_published);
        this.mqttServer.on('subscribed',             this.__broker_subscribed);
        this.mqttServer.on('unsubscribed',           this.__broker_unsubscribed);
        this.mqttServer.on('clientDisconnecting',    this.__broker_disconnecting);
        this.mqttServer.on('clientDisconnected',     this.__broker_disconnected);
        console.log('[MQTT] Mosca server is up and running on port ' + this.mqttPort);*/
    }

    /**
     * Private function, Auth function
     */
    __broker_auth(client, username, password, callback) {
        console.log('[HubManager MQTT] AUTH : ' + client.id + ' using ' + username + ':' + password);
        if (this.authConnCallback != null) {
            callback(null, this.authConnCallback(client, username, password));
        } else {
            callback(null, false); // block every auth if no callback defined
        }
    }

    /**
     * Private function, used to allow client subscription
     */
    __broker_allow_sub(client, topic, callback) {
        if (this.authorizeClientSubscription != null) {
            callback(null, this.authorizeClientSubscription(client, topic));
        } else {
            callback(null, false); // block subscribe if no callback define
        }
    }

    /**
     * Private function, used to allow client publish action
     */
    __broker_allow_pub(client, topic, payload, callback) {
        if (this.authorizeClientPublish != null) {
            callback(null, this.authorizeClientPublish(client, topic, payload));
        } else {
            callback(null, false); // block every publish if no callback defined
        }
    }

    /**
     * Private function, fired when a client is connected
     */
    __broker_connected(client) {
        console.log('[HubManager MQTT] ' + client.id + ' is now connected');
        if (this.onClientConnected != null) {
            this.onClientConnected(client);
        }
    };

    /**
     * Private function, fired when a message is received
     */
    __broker_published(packet, client) {

        // quick fix moche comme MJ
        if (client != undefined) {
            console.log('[HubManager MQTT] ' + client.id + ' published "' + JSON.stringify(packet.payload) + '" to ' + packet.topic);
            if (this.onClientPublished != null) {
                this.onClientPublished(client, packet.topic, packet.payload);
            }
        }
    };

    /**
     * Private function, fired when a client subscribes to a topic
     */
    __broker_subscribed(topic, client) {
        console.log('[HubManager MQTT] ' + client.id + ' has subscribed to ' + topic);
        if (this.onClientSubscribed != null) {
            this.onClientSubscribed(client, topic);
        }
    };

    /**
     * Private function, fired when a client unsubscribes from a topic
     */
    __broker_unsubscribed(topic, client) {
        console.log('[HubManager MQTT] ' + client.id + ' has unsubscribed from ' + topic);
        if (this.onClientUnsubscribed != null) {
            this.onClientUnsubscribed(client, topic);
        }
    };

    /**
     * Private function, fired when a client is disconnecting
     */
    __broker_disconnecting(client) {
        console.log('[HubManager MQTT] clientDisconnecting : ', client.id);
        // callback needed?... TODO
    };

    /**
     * Private function, fired when a client is disconnected
     */
    __broker_disconnected(client) {
        console.log('[HubManager MQTT] ' + client.id + ' is now disconnected');
        if (this.onClientDisconnected != null) {
            this.onClientDisconnected(client);
        }
    };
}
module.exports = HubManager;
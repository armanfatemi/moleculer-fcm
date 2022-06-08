/*
 * moleculer-fcm
 * Copyright (c) 2022 Arman (https://github.com/armanfatemi/moleculer-fcm)
 * MIT Licensed
 */

"use strict";
/**
 * Concepts:
 * 
 * DeviceGroup: Group of devices that should get the same push messages. This is usually used to handle multiple devices of a singel user.
 * By grouping a users devices, you don't need to send each message to each device separately, instead you can send a message to the user's device group 
 * NotificationToken: the address of a single device to send a notification
 * DeviceGroupNotificationKey: the address of a group of devices (i.e. multiple devices logged in with a same user) to send a notification 
 * DeviceGroupName: the name of a device group. This is not auto-generated and must be provided at the time of deviceGroup creation. it can be used to retrieve the DeviceGroupNotificationKey of a specific group
 * Topic: A subject that each device can susbcribe to, to get the messages published in that subject. Notice: DeviceGroup can not subscribe to a topic, just individual tokens (device) can subscribe to a topic. 
 * 
 * Read more about what are device groups and which APIs this service has implemented here: 
 * https://firebase.google.com/docs/cloud-messaging/js/device-group
 * 
 * Caution: Any apps that use device group messaging must continue to use the legacy API for the management of device groups (creating, updating, etc.). The HTTP v1 can send messages to device groups, but does not support management.
 * https://firebase.google.com/docs/cloud-messaging/migrate-v1
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const axios = require("axios");
// const { tokens } = require('./messageTemplates/completeWithLegacyFields');
// const RECIEVER_TYPES = ['SINGLE_DEVICE','MULTIPLE_DEVICES', 'DEVICE_GROUP', 'TOPIC', 'CONDITION']
module.exports = {

	name: "fcm",

	/**
	 * Default settings
	 */
	app:null, //will be initialized in the started()

	settings: {
		/**
		 * The protected settings won’t be published to other nodes and it won’t appear in Service Registry. 
		 * These settings will only available under this.settings inside the service functions.
		 */
		$secureSettings: ["firebaseProjectId", "firebaseDatabaseURL","firebaseConfig"],
		
		// initilizationType:'GCP', //uncomment this if you are deploying on GCP
		
		initilizationType:'ENV', // default. leave this uncommented if you set the GOOGLE_APPLICATION_CREDENTIALS environment variable
		// on Linux or macOS:
		// export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"
		// 
		// on Windows (with PowerShell):
		// $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"
		
		firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
		firebaseDatabaseURL: process.env.FIREBASE_DATABASE_URL || '', //https://<DATABASE_NAME>.firebaseio.com'

		fcmAPIConfig: {
			legacyEndpoint: "https://fcm.googleapis.com/fcm/notification", //this is just used for manageing device groups, and not sending to device groups
            sendEndpoint: 'https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send', // TODO: path is customized per project //this is used for any send request
			apiKey: process.env.FIREBASE_API_KEY || "<PUT YOUR FIREBASE API KEY HERE >",
			messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "<PUT THE MESSAGING SENDER ID OF YOUR FIREBASE PROJECT HERE>",			
		}
	},

	/**
	 * Actions
	 */
	actions: {
		test(ctx) {			
			return "Hello " + (ctx.params.name || "Anonymous");						
		},
        sendRaw:{
            params:{
                tokens:{type:'string', optional: true}, //TODO: change validation to cover string or array of strings
                topic:{type:'string', optional: true},
                condition:{type:'string', optional: true},
                deviceGroupKey:{type:'string', optional: true},                
                message:{type:'object'}
            },
            async handler(ctx){                

                let {tokens, topic, condition, deviceGroupKey, message} = ctx.params
                
                let recipientResponse = this.setRecipient(tokens, topic, condition, deviceGroupKey);
                if(!recipientResponse.success) return Promise.reject(recipientResponse.error);
                
                message[recipientResponse.key] = recipientResponse.value;
                
                return await this.send(message)
            }
        },

        sendWithTemplate:{
            params:{
                templateName:{type:'string'},
                overwritingMessageConfig:{type:'object', optional:true},
                tokens:{type:'string', optional: true}, //TODO: change validation to cover string or array of strings
                topic:{type:'string', optional: true},
                condition:{type:'string', optional: true},
                deviceGroupKey:{type:'string', optional: true}                                
            },
            async handler(ctx){
                let {tokens, topic, condition, deviceGroupKey, overwritingMessageConfig, templateName} = ctx.params
                
                //TODO: load template
                //TODO: create message
                //TODO: overwrite message with overWritingFields
                
                let recipientResponse = this.setRecipient(tokens, topic, condition, deviceGroupKey);
                if(!recipientResponse.success) return Promise.reject(recipientResponse.error);
                
                // return await this.send(message)

            }
        },
		/**
         * Create a new deviceGroup
         * 
         * @param {Array of string} nofiticationTokens - token of the devices that are going to be in the created group
         * @param {string} deviceGroupName - a name for the deviceGroup so that the group could be retrievable 
         * @returns {JSON} the response in case of success is an object with a single attribute "deviceGroupNotificationKey" of type string which is 
         * the notification key that can be used to send notification to the created deviceGroup 
         * in case of failure, it reponds with a failed promise with the error as the payload
         * 
         * NOTE: Invalid registration tokens are dropped when a device group is successfully created.
         */
		createDeviceGroup:{
            params:{
                notificationTokens:{type:'array'}, 
                deviceGroupName:{type:'string'}
            },
            async handler(ctx){
                try {
                    let response = await axios.post(
                        this.settings.fcmAPIConfig.legacyEndpoint,
                        {
                            operation: "create",
                            notification_key_name: crx.params.deviceGroupName,
                            registration_ids: ctx.params.notificationTokens,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "key=" + this.settings.fcmAPIConfig.apiKey,
                                project_id: '' + this.settings.fcmAPIConfig.messagingSenderId,
                            },
                        }
                    );

                    return Promise.resolve({
                        deviceGroupNotificationKey: response.data.notification_key,
                    });
                } catch (e) {
                                                  
                    if (e.response.data.error == "no valid registration ids") {
                        /** 
                         * the provided registration id is not correct. Check where you got the device tokens (usually client code)                        
                         * Hint: If your client code is a multiplatform (hybrid) application (i.e. reactNative, Framework7, Ionic, ...) 
                         * the procedure for obtaining a notification token from FCM could be different for each platform(Android, iOS, PWA, ...),
                         * make sure you have implemented all the platrom-specific implementations 
                        */  
                        return Promise.reject(e);
                    }

                    
                    if (e.response.data.error == "notification_key already exists") {
                        /**
                         * in this case the provided notification_key_name (deviceGroupName) already exists on the FCM, so we just add
                         * the provided notificationTokens to the existing deviceGroup
                         * at this point we fetch the current key with the group name, and use that to add new device token
                         * to the user group and get the new group token                
                         */
                        
                        //fetching the existing deviceGroup key by providing the deviceGroupName
                        let existingKey = await this.getNotifKeybyDeviceGroupName(
                            ctx.params.deviceGroupName
                        );

                        //adding the notificationTokens to the group, using the addDeviceToGroup action in this service 
                        return await ctx.call('fcm.addDeviceToGroup', {
                                notificationTokens:notificationTokens,
                                deviceGroupKey:existingKey.notification_key,
                                deviceGroupName: ctx.params.deviceGroupName
                            }
                        );
                    }
                    
                    //Unknown error happend
                    else return Promise.reject(e);
                    
                }
            }
        },

        /**
         * Add new notificationToken(s) to an existing deviceGroup
         * 
         * @param {Array of string} nofiticationTokens - token of the devices that are going to be added to the  group
         * @param {string} deviceGroupName - the name of the deviceGroup. This is optional, but providing it could prevent errors in case of wrong/misplaced deviceGroupKey
         * @param {string} deviceGroupKey - the key of the deviceGroup 
         * 
         * @returns {JSON} the response in case of success is an object with a single attribute "deviceGroupNotificationKey" of type string which is 
         * the notification key that can be used to send notification to the created deviceGroup 
         * in case of failure, it reponds with a failed promise with the error as the payload
         * 
         * NOTE: Invalid registration tokens are dropped when a device group is successfully created.
         */
        addDeviceToGroup:{
            params:{
                notificationTokens:{type:'array'},
                deviceGroupKey:{type:'string'},
                deviceGroupName:{type:'string'}     
            },
            async handler(ctx){
                try {
                    let response = await axios.post(
                        this.settings.fcmAPIConfig.legacyEndpoint,
                        {
                            operation: "add",
                            notification_key_name: ctx.params.deviceGroupName,
                            notification_key: ctx.params.deviceGroupKey,
                            registration_ids: ctx.params.notificationTokens,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "key=" + this.settings.fcmAPIConfig.apiKey,
                                project_id: this.settings.fcmAPIConfig.messagingSenderId,
                            },
                        }
                    );
    
                    return Promise.resolve({
                        deviceGroupNotificationKey: response.data.notification_key,
                    });
                } catch (e) {

                    if (e.response.data.error == "no valid registration ids") {
                         /** 
                         * the provided registration id is not correct. Check where you got the device tokens (usually client code)                        
                         * Hint: If your client code is a multiplatform (hybrid) application (i.e. reactNative, Framework7, Ionic, ...) 
                         * the procedure for obtaining a notification token from FCM could be different for each platform(Android, iOS, PWA, ...),
                         * make sure you have implemented all the platrom-specific implementations 
                        */  
                        return Promise.reject(e);
                    }
                        
                    /**
                     * the stored token is not correct, we will fetch the correct one using the groupname and try again
                     * */
                    if (
                        e.response.data.error == "notification_key not found" ||
                        e.response.data.error.includes(
                            "Error decrypting GroupToken"
                        )
                    ) {
    
                        return ctx.call('fcm.createDeviceGroup', {
                            notificationTokens:ctx.params.notificationTokens, 
                            deviceGroupName:ctx.params.deviceGroupName
                        });
                    }
    
                    return Promise.reject(e);
                }
            }
        },

        /**
         * 
         * 
         * NOTE: If you remove all existing registration tokens from a device group, FCM deletes the device group.
         */
        removeDeviceFromGroup:{
            params:{
                notificationTokens:{type:'array'},
                deviceGroupKey:{type:'string'},
                deviceGroupName:{type:'string'}
            },
            async handler(ctx){
                try {
                    let response = await axios.post(
                        this.settings.fcmAPIConfig.legacyEndpoint,
                        {
                            operation: "remove",
                            notification_key_name: ctx.params.deviceGroupName,
                            notification_key: ctx.params.deviceGroupKey,
                            registration_ids: ctx.params.notificationTokens,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "key=" + this.settings.fcmAPIConfig.apiKey,
                                project_id: this.settings.fcmAPIConfig.messagingSenderId,
                            },
                        }
                    );
    
                    return Promise.resolve({
                        deviceGroupNotificationKey: response.data.notification_key,
                    });
                } catch (e) {
                    if (e.response.data.error == "no valid registration ids") {
                        return Promise.resolve({
                            deviceGroupNotificationKey: notification_key,
                        });
                    }
    
                    if (
                        e.response.data.error == "notification_key not found" ||
                        e.response.data.error.includes(
                            "Error decrypting GroupToken"
                        )
                    ) {
                        let existingKey = await this.getExistingNotifKeyWithNotifName(
                            ctx.params.deviceGroupName
                        );
                        return this.removeDeviceFromGroup(
                            ctx.params.notificationTokens,
                            existingKey.notification_key,
                            ctx.params.deviceGroupName
                        );
                    }
    
                    return Promise.reject(e);
                }
            }
        },
        
        /**
		 * @param {string or Array of string} tokens - the notification token or array of multiple tokens of the subscribing devices
		 * IMPORTANT NOTE: You can not subscribe a deviceGroup to a topic. Unfortunately Goolge does not support this yet.
         * @param {string} topic - the name of the topic to subscribe to
         * @returns {Promise} in case of success there is no payload, in case of error the error will be passed  
		 * 
		 * read more here: 
		 * https://stackoverflow.com/questions/38114000/subscribe-a-device-group-notification-key-to-a-topic		 
		 * https://firebase.google.com/docs/cloud-messaging/manage-topics      
		 * https://firebase.google.com/docs/cloud-messaging/js/topic-messaging
		 * https://firebase.google.com/docs/cloud-messaging/js/device-group                
         */
        subscribeToTopic:{
			params:{
				tokens:{type:"string"},
				topic:{type:"string"}
			},
			async handler(ctx){
				
				return this.app
					.messaging()
					.subscribeToTopic(ctx.params.tokens, ctx.params.topic)
					.then(function (response) {						
						return Promise.resolve();
					})
					.catch(function (error) {
						this.logger.error(error)
						return Promise.reject(error);
					});				
			}
		},
        
        /**
         * @param {string or Array of string} tokens - the notification token or array of multiple tokens of the unsubscribing devices
		 * IMPORTANT NOTE: You can not unsubscribe a deviceGroup to a topic. Unfortunately Goolge does not support this yet
         * @param {string} topic - the name of the topic to unsubscribe from
         * @returns {Promise} in case of success there is no payload, in case of error the error will be passed   
		 * 
		 * read more here: 
		 * https://stackoverflow.com/questions/38114000/subscribe-a-device-group-notification-key-to-a-topic		 
		 * https://firebase.google.com/docs/cloud-messaging/manage-topics      
		 * https://firebase.google.com/docs/cloud-messaging/android/topic-messaging
		 * https://firebase.google.com/docs/cloud-messaging/android/device-group
         */
        unsubscribeFromTopic:{
			params:{
				tokens:{type:"string"},
				topic:{type:"string"}
			},
			async handler(ctx){
				
				return this.app
					.messaging()
					.unsubscribeFromTopic(ctx.params.tokens, ctx.params.topic)
					.then(function (response) {						
						return Promise.resolve();
					})
					.catch(function (error) {
						this.logger.error(error)
						return Promise.reject(error);
					});				
			}
		},
	},

	/**
	 * Methods
	 */
	methods: {  
        async sendWithAPI(message){
            try{
                let response = await axios.post(
                    this.settings.fcmAPIConfig.sendEndpoint,
                    message,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + this.settings.fcmAPIConfig.apiKey, //TODO: check if apikey for the V1 api is constant or we need to implement refresh tokens...
                            project_id: this.settings.fcmAPIConfig.messagingSenderId,
                        },
                    }
                );
                return Promise.resolve(reponse);

            } catch (e) {               
                return Promise.reject(e);
            }            
        },
        async sendWithSDK(message){},

        setRecipient(tokens, topic, condition, deviceGroupKey){

            if(condition){
                return {
                    success:true, 
                    key:'condition',
                    value:condition
                }
            
            }else if(topic){
                return {
                    success:true, 
                    key:'topic',
                    value:topic
                }
            
            }else if(deviceGroupKey){
                return {
                    success:true, 
                    key:'token',
                    value:token
                }
            
            }else if(tokens){
                
                if(Array.isArray(tokens)){
                    return {
                        success:true, 
                        key:'tokens',
                        value:tokens
                    }
                }else{
                    return {
                        success:true, 
                        key:'token',
                        value:tokens
                    }
                }

            }else{
                return {
                    success:false, 
                    error:"Cannot set message recipient. You must indicate at least one of 'tokens', 'condition', 'topic' or 'deviceGroupKey'."
                }
            }
        },

        async getNotifKeybyDeviceGroupName(deviceGroupName){
            try {
				let response = await axios.get(
					this.settings.fcmAPIConfig.legacyEndpoint +
						"?notification_key_name=" +
						deviceGroupName,
					{
						headers: {
							"Content-Type": "application/json",
							Authorization: "key=" + this.settings.fcmAPIConfig.apiKey,
							project_id: this.settings.fcmAPIConfig.messagingSenderId,
						},
					}
				);

				return Promise.resolve({
					notification_key: response.data.notification_key,
				});
			} catch (e) {
				return Promise.reject(e);
			}
        },		
        async sendWithSDK(message){
            //Read more here: https://firebase.google.com/docs/cloud-messaging/js/first-message

            // .send(message)
            // .sendToDevice(registrationToken, payload)
            // .sendAll(messages) // send multiple messages
            // .sendMulticast(message) // send to multiple tokens
            // .sendToDeviceGroup(notificationKey, payload) // send to a device group
            
            app.messaging().send(message)
                .then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return res.send("Done")
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                    return res.send("Error")
                });			
        },
        messageBuilder(){
            let message = ''
        }
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
        if(this.settings.initilizationType == 'ENV' && this.settings.firebaseDatabaseURL){			
			
			this.app = initializeApp({
				credential: applicationDefault(),
				databaseURL: this.settings.firebaseDatabaseURL
			});		

		}else if(this.settings.initilizationType == "GCP" && this.settings.firebaseProjectId){			
			this.app = initializeApp({
				credential: applicationDefault(),
				projectId: this.settings.firebaseProjectId,
			});
		
		}else{
			this.app = initializeApp();
		}								 		
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {		
				
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		
	}
};
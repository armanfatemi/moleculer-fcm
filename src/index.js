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
 * Topic: Group of devices and deviceGroups that are subscribed to a specific subject/topic. the name of the topic should be generated in the code and should be kept for sending a notif to the topic
 * 
 * Read more about what are device groups and which APIs this service has implemented here: 
 * https://firebase.google.com/docs/cloud-messaging/js/device-group
 */


module.exports = {

	name: "fcm",

	/**
	 * Default settings
	 */
	settings: {
		/**
		 * The protected settings won’t be published to other nodes and it won’t appear in Service Registry. 
		 * These settings will only available under this.settings inside the service functions.
		 */
		$secureSettings: ["firebaseConfig"],

		firebaseConfig: {
			notificationEndPoint: proccess.env.FCM_ENDPOINT || "https://fcm.googleapis.com/fcm/notification",
			apiKey: proccess.env.FIREBASE_API_KEY || "<PUT YOUR FIREBASE API KEY HERE >",
			messagingSenderId: proccess.env.FIREBASE_MESSAGING_SENDER_ID || "<PUT THE MESSAGING SENDER ID OF YOUR FIREBASE PROJECT HERE>",
		}
	},

	/**
	 * Actions
	 */
	actions: {
		test(ctx) {
			return "Hello " + (ctx.params.name || "Anonymous");
		},
		/**
         * @param {Array of string} nofiticationTokens - token of the devices that are going to be in the created group
         * @param {string} groupName - a name for the deviceGroup so that the group could be retrievable 
         * @returns {JSON} the response in case of success is an object with a single attribute "deviceGroupNotificationKey" of type string which is 
         * the notification key that can be used to send notification to the created deviceGroup 
         * in case of failure, it reponds with a failed promise with the error as the payload
         * 
         * NOTE: Invalid registration tokens are dropped when a device group is successfully created.
         */
		 generateDeviceGroup:{
            params:{
                notificationTokens:{type:'array'}, 
                groupName:{type:'string'}
            },
            async handler(ctx){
                try {
                    let response = await axios.post(
                        this.settings.firebaseConfig.notificationEndPoint,
                        {
                            operation: "create",
                            notification_key_name: crx.params.groupName,
                            registration_ids: ctx.params.notificationTokens,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "key=" + this.settings.firebaseConfig.apiKey,
                                project_id: "" + this.settings.firebaseConfig.messagingSenderId,
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
                         * in this case the provided notification_key_name (groupName) already exists on the FCM, so we just add
                         * the provided notificationTokens to the existing deviceGroup
                         * at this point we fetch the current key with the group name, and use that to add new device token
                         * to the user group and get the new group token                
                         */
                        
                        //fetching the existing deviceGroup key by providing the groupName
                        let existingKey = await this.getNotifKeybyDeviceGroupName(
                            ctx.params.groupName
                        );

                        //adding the notificationTokens to the group, using the addDeviceToDeviceGroup action in this service 
                        return await ctx.call('fcm.addDeviceToDeviceGroup', {
                                notificationTokens:notificationTokens,
                                deviceGroupNotifToken:existingKey.notification_key,
                                groupName: ctx.params.groupName
                            }
                        );
                    }
                    
                    //Unknown error happend
                    else return Promise.reject(e);
                    
                }
            }
        },
        addDeviceToDeviceGroup:{
            params:{
                notificationTokens:{type:'array'},
                deviceGroupNotifToken:{type:'string'},
                groupName:{type:'string'}     
            },
            async handler(ctx){
                try {
                    let response = await axios.post(
                        this.settings.firebaseConfig.notificationEndPoint,
                        {
                            operation: "add",
                            notification_key_name: ctx.params.groupName,
                            notification_key: ctx.params.deviceGroupNotifToken,
                            registration_ids: ctx.params.notificationTokens,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "key=" + this.settings.firebaseConfig.apiKey,
                                project_id: this.settings.firebaseConfig.messagingSenderId,
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
    
                        return ctx.call('fcm.generateDeviceGroup', {
                            notificationTokens, 
                            groupName
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
        removeDeviceFromDeviceGroup:{
            params:{
                notificationTokens:{type:'array'},
                deviceGroupNotifToken:{type:'string'},
                groupName:{type:'string'}
            },
            async handler(ctx){
                try {
                    let response = await axios.post(
                        this.settings.firebaseConfig.notificationEndPoint,
                        {
                            operation: "remove",
                            notification_key_name: ctx.params.groupName,
                            notification_key: ctx.params.deviceGroupNotifToken,
                            registration_ids: ctx.params.notificationTokens,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "key=" + this.settings.firebaseConfig.apiKey,
                                project_id: this.settings.firebaseConfig.messagingSenderId,
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
                            ctx.params.groupName
                        );
                        return this.removeDeviceFromGroup(
                            ctx.params.notificationTokens,
                            existingKey.notification_key,
                            ctx.params.groupName
                        );
                    }
    
                    return Promise.reject(e);
                }
            }
        },
        
        /**
         * the provided token could be for a single device or a device group
         */
        subscribeToTopic:{},
        
        /**
         * the provided token could be for a single device or a device group
         */
        unsubscribeDeviceGroupFromTopic:{},

        sendNotifToSingleDevice:{},
        sendNotifToTopic:{},
        sendNotifToDeviceGroup:{},

	},

	/**
	 * Methods
	 */
	methods: {        

        async getNotifKeybyDeviceGroupName(groupName){
            try {
				let response = await axios.get(
					this.settings.firebaseConfig.notificationEndPoint +
						"?notification_key_name=" +
						groupName,
					{
						headers: {
							"Content-Type": "application/json",
							Authorization: "key=" + this.settings.firebaseConfig.apiKey,
							project_id: this.settings.firebaseConfig.messagingSenderId,
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
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

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
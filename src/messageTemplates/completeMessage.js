module.exports = {
    notification: {
        title: '',
        body:'',        
    },

    data: {              
        //Arbitrary key/value payload      
    },
    
    android: {
        notification: {
            title: '', // The notification's title. If present, it will override google.firebase.fcm.v1.Notification.title.
            body: '', // The notification's body text. If present, it will override google.firebase.fcm.v1.Notification.body.
            icon: '', // The notification's icon. Sets the notification icon to myicon for drawable resource myicon. If you don't send this key in the request, FCM displays the launcher icon specified in your app manifest.
            color: '', // The notification's icon color, expressed in #rrggbb format.
            sound: '', // The sound to play when the device receives the notification. Supports "default" or the filename of a sound resource bundled in the app. Sound files must reside in /res/raw/.
            tag: '', // Identifier used to replace existing notifications in the notification drawer. If not specified, each request creates a new notification. If specified and a notification with the same tag is already being shown, the new notification replaces the existing one in the notification drawer.
            click_action: '', // The action associated with a user click on the notification. If specified, an activity with a matching intent filter is launched when a user clicks on the notification.
            body_loc_key: '', // The key to the body string in the app's string resources to use to localize the body text to the user's current localization.
            body_loc_args: [ // Variable string values to be used in place of the format specifiers in body_loc_key to use to localize the body text to the user's current localization
              '', ''
            ],
            title_loc_key: '', // The key to the title string in the app's string resources to use to localize the title text to the user's current localization
            title_loc_args: [ // Variable string values to be used in place of the format specifiers in title_loc_key to use to localize the title text to the user's current localization.
              '', ''
            ],
            channel_id: '', // The notification's channel id (new in Android O). The app must create a channel with this channel ID before any notification with this channel ID is received. If you don't send this channel ID in the request, or if the channel ID provided has not yet been created by the app, FCM uses the channel ID specified in the app manifest.
            ticker: '', // Sets the "ticker" text, which is sent to accessibility services. Prior to API level 21 (Lollipop), sets the text that is displayed in the status bar when the notification first arrives.
            sticky: false, // When set to false or unset, the notification is automatically dismissed when the user clicks it in the panel. When set to true, the notification persists even when the user clicks it.
            event_time: "", // Set the time that the event in the notification occurred. Notifications in the panel are sorted by this time. in RFC3339 UTC "Zulu" format, accurate to nanoseconds. example: "2014-10-02T15:01:23.045123456Z"
            local_only: false, //Set whether or not this notification is relevant only to the current device. Some notifications can be bridged to other devices for remote display, such as a Wear OS watch. This hint can be set to recommend this notification not be bridged.
            
            // PRIORITY_UNSPECIFIED: If priority is unspecified, notification priority is set to PRIORITY_DEFAULT.
            // PRIORITY_MIN: Lowest notification priority. Notifications with this PRIORITY_MIN might not be shown to the user except under special circumstances, such as detailed notification logs.
            // PRIORITY_LOW: Lower notification priority. The UI may choose to show the notifications smaller, or at a different position in the list, compared with notifications with PRIORITY_DEFAULT.
            // PRIORITY_DEFAULT: Default notification priority. If the application does not prioritize its own notifications, use this value for all notifications.
            // PRIORITY_HIGH: Higher notification priority. Use this for more important notifications or alerts. The UI may choose to show these notifications larger, or at a different position in the notification lists, compared with notifications with PRIORITY_DEFAULT.
            // PRIORITY_MAX:	Highest notification priority. Use this for the application's most important items that require the user's prompt attention or input.
            notification_priority: '', // enum. PRIORITY_UNSPECIFIED, PRIORITY_MIN, PRIORITY_LOW, PRIORITY_DEFAULT, PRIORITY_HIGH, PRIORITY_MAX
            
            default_sound: true, //If set to true, use the Android framework's default sound for the notification
            default_vibrate_timings: true, // If set to true, use the Android framework's default vibrate pattern for the notification. 
            default_light_settings: true, // If set to true, use the Android framework's default LED light settings for the notification.
            vibrate_timings: [ // Set the vibration pattern to use.
              //'', '', '' ...
            ],
            
            // VISIBILITY_UNSPECIFIED: If unspecified, default to Visibility.PRIVATE.
            // PRIVATE: Show this notification on all lockscreens, but conceal sensitive or private information on secure lockscreens.
            // PUBLIC: Show this notification in its entirety on all lockscreens.
            // SECRET: Do not reveal any part of this notification on a secure lockscreen.
            visibility: '', //enum. VISIBILITY_UNSPECIFIED, PRIVATE, PUBLIC, SECRET
            
            notification_count: 0, // Sets the number of items this notification represents. May be displayed as a badge count for launchers that support badging
            light_settings: {
                color: { //Required. Set color of the LED with google.type.Color.
                    red: 0.2, //The amount of red in the color as a value in the interval [0, 1].
                    green: 0.1, //The amount of red in the color as a value in the interval [0, 1].
                    blue: 0.8, //The amount of red in the color as a value in the interval [0, 1].
                    alpha: 0 //The amount of red in the color as a value in the interval [0, 1].
                },
                light_on_duration: "3.5s", //A duration in seconds with up to nine fractional digits, terminated by 's'. Example: "3.5s".
                light_off_duration: "3.5s" //A duration in seconds with up to nine fractional digits, terminated by 's'. Example: "3.5s".
              },
            image: "", // Contains the URL of an image that is going to be displayed in a notification. If present, it will override google.firebase.fcm.v1.Notification.image.
        },
        direct_boot_ok : true, // If set to true, messages will be allowed to be delivered to the app while the device is in direct boot mode.
        collapse_key: '', // An identifier of a group of messages that can be collapsed, so that only the last message gets sent when delivery can be resumed. A maximum of 4 different collapse keys is allowed at any given time.

        // NORMAL: Default priority for data messages. Normal priority messages won't open network connections on a sleeping device, and their delivery may be delayed to conserve the battery.
        // HIGH: Default priority for notification messages. FCM attempts to deliver high priority messages immediately
        priority: '', // enum. NORMAL, HIGH
        ttl: '3.5s', // How long (in seconds) the message should be kept in FCM storage if the device is offline.The maximum time to live supported is 4 weeks, and the default value is 4 weeks if not set. Set it to 0 if want to send the message immediately. In JSON format, the Duration type is encoded as a string rather than an object, where the string ends in the suffix "s" (indicating seconds) and is preceded by the number of seconds, with nanoseconds expressed as fractional seconds.
        restricted_package_name: '', // Package name of the application where the registration token must match in order to receive the message.
        fcm_options: {
            analytics_label: '', //Label associated with the message's analytics data.
        }
    },
    apns: {
        headers: { 
            //HTTP request headers defined in Apple Push Notification Service. e.g. "apns-priority": "10".
            // Refer to APNs request headers for supported headers https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns                        
            
        },
        payload: {
            // APNs payload as a JSON object, including both aps dictionary and custom payload. 
            // If present, it overrides google.firebase.fcm.v1.Notification.title and google.firebase.fcm.v1.Notification.body.
            // See Payload Key Reference https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification
            // type is object,
            
            // following is optional
            aps:{
                alert: {
                    locKey: '', // The key to the title string in the app's string resources to use to localize the title text to the user's current localization
                    locArgs: [] // Variable string values to be used in place of the format specifiers in title_loc_key to use to localize the title text to the user's current localization.
                }
            }
        },
        fcm_options: {
            analytics_label: '', //Label associated with the message's analytics data.
            image: '' //Contains the URL of an image that is going to be displayed in a notification. If present, it will override google.firebase.fcm.v1.Notification.image.
        },
        
    },
    webpush: {
        headers: { 
            //HTTP headers defined in webpush protocol. Refer to Webpush protocol for supported headers, e.g. "TTL": "15".
            //An object containing a list of "key": value pairs. Example: { "name": "wrench", "mass": "1.3kg", "count": "3" }.
                             
        },
        data: { 
            //Arbitrary key/value payload. If present, it will override google.firebase.fcm.v1.Message.data.                      
        },
        notification: {
            // Web Notification options as a JSON object. Supports Notification instance properties as defined in Web Notification API. 
            //If present, "title" and "body" fields override google.firebase.fcm.v1.Notification.title and google.firebase.fcm.v1.Notification.body.
            
        },
        fcm_options: {
            link: '', //The link to open when the user clicks on the notification. For all URL values, HTTPS is required.
            analytics_label: '' //Label associated with the message's analytics data.
        }
    },    

    // Union field target can be only one of the following:
    token: '',
    topic: '',
    condition: '',
    tokens:['','']
    // End of list of possible types for union field target.  
};
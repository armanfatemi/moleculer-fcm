"use strict";

let { ServiceBroker } 	= require("moleculer");
let MyService 			= require("../../index");

// Create broker
let broker = new ServiceBroker({
	logger: console
});

// Load my service
/**
 * There are multilple ways to setup firebase admin: 
 * for full documentation read here:		 
 * https://firebase.google.com/docs/admin/setup		 
 * 
 * -------------------------------------------------------------------
 * 1- To set the environment variable:
 * Set the environment variable GOOGLE_APPLICATION_CREDENTIALS to the file path of the JSON file that contains your service account key. 
 * This variable only applies to your current shell session, so if you open a new session, set the variable again.
 * 
 * on Linux or macOS:
 * export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"
 * 
 * on Windows (with PowerShell):
 * $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"
 * For this method, uncomment the bellow line:
 */

// const app = initializeApp({
// 	credential: applicationDefault(),
//	databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
// });
	
	/**
	 * ------------------------------------------------------------------ 
	 * 2- Using an OAuth 2.0 refresh token
	 * The Admin SDK also provides a credential which allows you to authenticate with a Google OAuth2 refresh token.
	 * For this method, uncomment the bellow line:  
	 */
	
//const myRefreshToken = '...'; // Get refresh token from OAuth2 flow		  
//const app = initializeApp({
//	credential: refreshToken(myRefreshToken),
//	databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
//});


	/**
	 * ------------------------------------------------------------------ 
 * 3- If you are deploying your application with Firebase CLI
 * In this case, the SDK uses Google Application Default Credentials. Because default credentials lookup is fully automated in Google environments, 
 * with no need to supply environment variables or other configuration, this way of intializing the SDK is strongly recommeneded for applications 
 * running on Compute Engine, Kubernetes Engine, App Engine, and Cloud Functions.
 * For this method, uncomment the bellow line:
 */ 
broker.createService(MyService);

// Start server
broker.start().then(() => {

	// Call action
	broker
		.call("fcm.test", { name: "Moleculer User!" })
		.then(broker.logger.info)
		.catch(broker.logger.error);

});

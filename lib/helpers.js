/**
 * Helpers
 * 
 */

// Dependencies
import crypto from 'crypto';
import https from 'https';
import querystring from 'querystring';
import config from '../config.js';


// Container for helpers
const helpers = {};

// Create a SHA-256 hash
helpers.hash = str => {
    if (typeof str === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object, without error throwing
helpers.parseJsonToObject = str => {
    try {
        return JSON.parse(str);
    } catch (error) {
        return {};
    }
};

// Create a string of random alphanumeric characters with a given length
// @PARAMS string_length: number
helpers.createRandomString = strLength => {
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;
    const possibleChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let str = '';
    for (let i = 1; i <= strLength; i++) {
        const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        str += randomChar;
    }
    return str;
};

helpers.sendTwilioSms = (phone, msg, callback) => {
    phone = typeof phone === 'string' && phone.trim().length === 9||10 ? phone.trim() : null;
    msg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim() : null;

    if (phone && msg) {
        // Configure the request payload
        const payload = {
            From: config.twilio.fromPhone,
            To: `+353${phone}`,
            Body: msg
        };
        //Stringify the payload
        const payloadString = querystring.stringify(payload);

        // Configure the request details
        const requestDetails = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        };

        // Instantiate the request object
        const req = https.request(requestDetails, res => {
            // Grab the status of the sent request
            const status = res.statusCode;
            // Callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback(null);
            } else {
                // console.error(res)
                callback(`Status code returned was ${status}.`);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', err => {
            console.error(err)
            callback(err);
        });

        // Add the payload to the request
        req.write(payloadString);

        // End the request (it sends the request)
        req.end();
    }
}
export default helpers;

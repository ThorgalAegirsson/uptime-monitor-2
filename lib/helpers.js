/**
 * Helpers
 * 
 */

// Dependencies
import crypto from 'crypto';
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

export default helpers;

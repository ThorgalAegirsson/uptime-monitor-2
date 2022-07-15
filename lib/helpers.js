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

export default helpers;

// Parse a JSON string to an object, without error throwing
helpers.parseJsonToObject = str => {
    try {
        return JSON.parse(str);
    } catch (error) {
        return {};
    }
}
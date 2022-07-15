/**
 * Request handlers
 * 
 */

// Dependencies
import _data from './data.js';
import helpers from './helpers.js';

// Define router handlers
const handlers = {};

// Users handler
handlers.users = (data, callback) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.includes(data.method)) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for users submethods
handlers._users = {};

// Users methods

// @PARAMS: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.POST = (data, callback) => {
    // validate form - check that all required fields are filled out
    const input = data.payload;
    const firstName = typeof input.firstName === 'string' && input.firstName.trim().length > 0 ? input.firstName.trim() : false;
    const lastName = typeof input.lastName === 'string' && input.lastName.trim().length > 0 ? input.lastName.trim() : false;
    const phone = typeof input.phone === 'string' && input.phone.trim().length === 10 ? input.phone.trim() : false;
    const password = typeof input.password === 'string' && input.password.trim().length > 0 ? input.password.trim() : false;
    const tosAgreement = typeof input.tosAgreement === 'boolean' && input.tosAgreement === true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, (err, data) => {
            if (err) { // no such user
                // hash the password
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // create a user object
                    const user = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement: true
                    };

                    // save the user to db
                    _data.create('users', phone, user, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { Error: 'Could not create the new user' });
                        }
                    });

                } else {
                    callback(500, { Error: 'Could not hash the user\'s password' });
                }

            } else {
                callback(400, { Error: 'User with this phone number already exists' });
            }
        });
    } else {
        callback(400, { Error: 'Missing required fields' });
    }

};

// @PARAMS: phone
// Optional data: none
// @TODO: only let authenticated users access their data
handlers._users.GET = (data, callback) => {
    // check the phone number is valid
    const reqData = data.queryStringObject;
    const phone = typeof reqData.phone === 'string' && reqData.phone.length === 10 ? reqData.phone : null;
    if (phone) {
        _data.read('users', phone, (err, userData) => {
            if (!err) {
                // remove hashed password
                delete userData.hashedPassword;
                callback(200, userData);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// @PARAMS: phone
// Optional: firstName, lastName, password (minimum 1 required)
// @TODO: only let authenticated users access their data
handlers._users.PUT = (data, callback) => {
    // check the phone number is valid
    const reqData = data.queryStringObject;
    const payload = data.payload
    const phone = typeof reqData.phone === 'string' && reqData.phone.length === 10 ? reqData.phone : null;

    // check the optional params
    const firstName = typeof payload.firstName === 'string' && payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
    const lastName = typeof payload.lastName === 'string' && payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
    const password = typeof payload.password === 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;

    if (phone) {
        // check if anything to update?
        if (firstName || lastName || password) {
            _data.read('users', phone, (err, userData) => {
                if (!err) {
                    if (firstName) userData.firstName = firstName;
                    if (lastName) userData.lastName = lastName;
                    if (password) userData.password = helpers.hash(password);
                    
                    // Save the user to db
                    _data.update('users', phone, userData, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { Error: "Error saving the user data" });
                        }
                    });
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, { Error: 'Nothing to update' });
        }
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// @PARAMS: phone
// Optional: none
// @TODO: only authenticated user
// @TODO: clean up any other data files associated with the user
handlers._users.DELETE = (data, callback) => {
    //check the phone number
    const reqData = data.queryStringObject;
    const phone = typeof reqData.phone === 'string' && reqData.phone.length === 10 ? reqData.phone : null;
    if (phone) {
        _data.delete('users', phone, err => {
            if (!err) {
                callback(200);
            } else {
                callback(400, { Error: 'Could not delete the user' });
            }
        });
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// Ping handler
handlers.ping = (data, callback) => {
    callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

export default handlers;
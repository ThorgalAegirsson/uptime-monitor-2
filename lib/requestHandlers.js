/**
 * Request handlers
 * 
 */

// Dependencies
import _data from './data.js';
import helpers from './helpers.js';

// Define router handlers
const handlers = {};



// Container for users submethods
const _users = {};

// Users methods

// @PARAMS: firstName, lastName, phone, password, tosAgreement
// Optional data: none
_users.POST = (data, callback) => {
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
_users.GET = (data, callback) => {
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
_users.PUT = (data, callback) => {
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
_users.DELETE = (data, callback) => {
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

// Users handler
handlers.users = (data, callback) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.includes(data.method)) {
        _users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for token methods
const _tokens = {};

// @PARAMS: phone, password
// Optional: none
_tokens.POST = (data, callback) => {
    // validate form - check that all required fields are filled out
    const input = data.payload;
    const phone = typeof input.phone === 'string' && input.phone.trim().length === 10 ? input.phone.trim() : false;
    const password = typeof input.password === 'string' && input.password.trim().length > 0 ? input.password.trim() : false;
    if (phone && password) {
        const token = helpers.createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60;
        const tokenObject = {
            phone,
            token,
            expires
        };
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.hashedPassword) {
                    _data.create('tokens', token, tokenObject, err => { 
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { Error: 'Could not create the new token' });
                        }
                    });
                } else {
                    callback(400, { Error: 'Incorrect password' });
                }
            } else {
                callback(400, { Error: 'Could not find the user' });
            }          
        });
    } else {
        callback(400, { Error: 'Missing login info' });
    }
};

// @PARAMS: token
// Optional: none
_tokens.GET = (data, callback) => {
    // check the token is valid
    const reqData = data.queryStringObject;
    const token = typeof reqData.token === 'string' && reqData.token.length === 20 ? reqData.token : null;
    if (token) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// @PARAMS: token, extend
// Optional: none
_tokens.PUT = (data, callback) => {
    // validate form - check that all required fields are filled out
    const input = data.payload;
    const token = typeof input.token === 'string' && input.token.trim().length === 20 ? input.token.trim() : false;
    const extend = typeof input.extend === 'boolean' && input.extend === true ? true : false;
    if (token && extend) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', token, tokenData, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { Error: 'Could not refresh token' });
                        }
                    })
                } else {
                    callback(400, {Error: 'Token already expired'});
                }
            } else {
                callback(400, { Error: 'No token found' });
            }
        })
    } else {
        callback(400, { Error: "Missing required field(s) or field(s) are invalid" });
    }
};

// @PARAMS: token,
// Optional: none
_tokens.DELETE = (data, callback) => {
    //check the token
    const reqData = data.queryStringObject;
    const token = typeof reqData.token === 'string' && reqData.token.length === 20 ? reqData.token : null;
    if (token) {
        _data.delete('tokens', token, err => {
            if (!err) {
                callback(200);
            } else {
                callback(404, { Error: 'Could not delete the token' });
            }
        });
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// Token handler
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.includes(data.method)) {
        _tokens[data.method](data, callback);
    } else {
        callback(405);
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
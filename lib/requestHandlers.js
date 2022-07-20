/**
 * Request handlers
 * 
 */

// Dependencies
import _data from './data.js';
import helpers from './helpers.js';
import config from '../config.js';

// Define router handlers
const handlers = {};



// Container for users submethods
const _users = {};

// Container for token methods
const _tokens = {};

// Container for checks methods
const _checks = {};


/**
 * Users methods
 */

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
_users.GET = (data, callback) => {
    // check the phone number is valid
    const reqData = data.queryStringObject;
    const phone = typeof reqData.phone === 'string' && reqData.phone.length === 10 ? reqData.phone : null;
    if (phone) {
        //verify the user is authenticated
        const token = typeof data.headers.token === 'string' ? data.headers.token : null;
        _tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, userData) => {
                    if (!err) {
                        // remove hashed password
                        delete userData.hashedPassword;
                        callback(200, userData);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { Error: 'User is not authenticated' });
            }
        });
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// @PARAMS: phone
// Optional: firstName, lastName, password (minimum 1 required)
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
        //verify the user is authenticated
        const token = typeof data.headers.token === 'string' ? data.headers.token : null;
        _tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
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
                callback(403, { Error: 'User is not authenticated' });
            }
        });
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

// @PARAMS: phone
// Optional: none
_users.DELETE = (data, callback) => {
    //check the phone number
    const reqData = data.queryStringObject;
    const phone = typeof reqData.phone === 'string' && reqData.phone.length === 10 ? reqData.phone : null;
    if (phone) {
        //verify the user is authenticated
        const token = typeof data.headers.token === 'string' ? data.headers.token : null;
        _tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
                // remove user profile
                _data.read('users', phone, (err, userData) => {
                    if (!err) {
                        // remove user checks
                        _data.delete('users', phone, err => {
                            if (!err) {
                                const checks = userData.checks || [];
                                checks.forEach(check => {
                                    _data.delete('checks', check, err => {
    
                                    });
                                });
                                callback(200);
                            } else {
                                callback(400, { Error: "User has been deleted but their monitors have not" });
                            }
                        });
                    } else {
                        callback(400, { Error: 'Could not find the user' });
                    }
                });
            } else {
                callback(403, { Error: 'User is not authenticated' });
            }
        });

    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

/**
 * Token methods
 */


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
                    callback(400, { Error: 'Token already expired' });
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

// Verify a given token is valid for the user
_tokens.verifyToken = (token, phone, callback) => {
    _data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone === phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

/**
 * Checks methods
 */

/**
 * @PARAMS: protocol, url, method, succesCodes, timeoutSeconds
 * Optional: none
 */

_checks.POST = (data, callback) => {
    // validate form - check that all required fields are filled out
    const input = data.payload;
    const protocol = typeof input.protocol === 'string' && ['http', 'https'].includes(input.protocol) ? input.protocol : null;
    const url = typeof input.url === 'string' && input.url.trim().length > 0 ? input.url.trim() : null;
    const method = typeof input.method === 'string' && ['get', 'post', 'put', 'delete'].includes(input.method.toLowerCase()) ? input.method : null;
    const successCodes = typeof input.successCodes === 'object' && input.successCodes instanceof Array && input.successCodes.length > 0 ? input.successCodes : null;
    const timeoutSeconds = typeof input.timeoutSeconds === 'number' && input.timeoutSeconds > 1 && input.timeoutSeconds <= 5 && input.timeoutSeconds % 1 === 0 ? input.timeoutSeconds : null;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        //verify the user is authenticated
        const token = typeof data.headers.token === 'string' ? data.headers.token : null;
        // lookup the user with the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData && tokenData.expires > Date.now()) {
                const userPhone = tokenData.phone;
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        const checks = userData.checks instanceof Array ? userData.checks : [];
                        const maxChecks = userData.paidAccount ? config.maxPaidChecks : config.maxFreeChecks; // change if the user is not free
                        // verify the user has available slots for a new check
                        if (checks.length < maxChecks) {
                            const checkId = helpers.createRandomString(20);
                            const checkObject = {
                                id: checkId,
                                userPhone,
                                protocol,
                                method,
                                url,
                                successCodes,
                                timeoutSeconds
                            };
                            // persist the object in db
                            _data.create('checks', checkId, checkObject, err => {
                                if (!err) {
                                    userData.checks = checks;
                                    userData.checks.push(checkId);
                                    // persist user data in db
                                    _data.update('users', userPhone, userData, err => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { Error: "Could not save the new check in the user profile" });
                                        }
                                    })
                                } else {
                                    callback(500, { Error: 'Could not save the check to the db' });
                                }
                            })
                        } else {
                            callback(400, { Error: `The user has already used up all the available checks (${maxChecks}). Remove one before adding a new check` });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, { Error: 'Missing required field(s)' });
    }

};

/**
 * 
 * PARAMS: check id 
 * Optional: none
 */
_checks.GET = (data, callback) => {
    // check the check id is valid
    const reqData = data.queryStringObject;
    const id = typeof reqData.id === 'string' && reqData.id.length === 20 ? reqData.id : null;
    if (id) {
        // find the user that owns the check
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //verify the user is authenticated
                const token = typeof data.headers.token === 'string' ? data.headers.token : null;
                _tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) {
                        callback(200, checkData);
                    } else {
                        callback(403, { Error: 'User is not authenticated' });
                    }
                });
            } else {
                console.log(err)
                callback(404, { Error: "No monitor found" });
            }
        });
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};

/**
 * 
 * PARAMS: check id 
 * Optional:  protocol, url, method, succesCodes, timeoutSeconds. At least one must be present
 */
_checks.PUT = (data, callback) => {
    const input = data.payload;
    // check the check id is valid
    const id = typeof input.id === 'string' && input.id.length === 20 ? input.id : null;

    // validate form
    const protocol = typeof input.protocol === 'string' && ['http', 'https'].includes(input.protocol) ? input.protocol : null;
    const url = typeof input.url === 'string' && input.url.trim().length > 0 ? input.url.trim() : null;
    const method = typeof input.method === 'string' && ['get', 'post', 'put', 'delete'].includes(input.method.toLowerCase()) ? input.method : null;
    const successCodes = typeof input.successCodes === 'object' && input.successCodes instanceof Array && input.successCodes.length > 0 ? input.successCodes : null;
    const timeoutSeconds = typeof input.timeoutSeconds === 'number' && input.timeoutSeconds > 1 && input.timeoutSeconds <= 5 && input.timeoutSeconds % 1 === 0 ? input.timeoutSeconds : null;

    if (id && protocol || url || method || successCodes || timeoutSeconds) {
        // find the user that owns the check
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //verify the user is authenticated
                const token = typeof data.headers.token === 'string' ? data.headers.token : null;
                _tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) {
                        // modify the check

                        const checkObject = { ...checkData };

                        checkObject.protocol = protocol || checkObject.protocol;
                        checkObject.method = method || checkObject.method;
                        checkObject.url = url || checkObject.url;
                        checkObject.successCodes = successCodes || checkObject.successCodes;
                        checkObject.timeoutSeconds = timeoutSeconds || checkObject.timeoutSeconds;
                        // persist the object in db
                        _data.update('checks', id, checkObject, err => {
                            if (!err) {
                                callback(200, checkObject);
                            } else {
                                callback(500, { Error: 'Could not save the check to the db' });
                            }
                        });
                    } else {
                        callback(403, { Error: 'User is not authenticated' });
                    }
                });
            } else {
                callback(404, { Error: "No monitor found" });
            }
        });
    } else {
        callback(400, { Error: 'Missing required field' });
    }
};


/**
 * 
 * PARAMS: id
 * Optional: none
 */
_checks.DELETE = (data, callback) => {
    //check the id
    const reqData = data.queryStringObject;
    const id = typeof reqData.id === 'string' && reqData.id.length === 20 ? reqData.id : null;
    if (id) {
        // find the user that owns the check
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //verify the user is authenticated
                const token = typeof data.headers.token === 'string' ? data.headers.token : null;
                _tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) {
                        // delete check from user profile
                        _data.read('users', checkData.userPhone, (err, userData) => {
                            if (!err && userData) {
                                // find the check, remove from array
                                userData.checks = userData.checks.filter(item => item !== id);
                                // save user
                                _data.update('users', checkData.userPhone, userData, err => {
                                    if (!err) {
                                        // delete check from db
                                        _data.delete('checks', id, err => {
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500, { Error: "Could not remove the monitor from DB" });
                                            }
                                        })
                                    } else {
                                        callback(500, { Error: 'Error updating user profile' });
                                    }
                                });
                            } else {
                                callback(400, { Error: 'Something went wrong when reading user profile' })
                            }
                        })

                    } else {
                        callback(403, { Error: 'User is not authenticated' });
                    }
                });
            }
        });
    } else {
        callback(404, { Error: "No monitor found" });
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

// Token handler
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.includes(data.method)) {
        _tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// checks handler
handlers.checks = (data, callback) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.includes(data.method)) {
        _checks[data.method](data, callback);
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
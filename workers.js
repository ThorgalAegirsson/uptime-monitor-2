/**
 * Workers related tasks
 * 
 */

// Dependencies
import path from 'path';
import fs from 'fs';
import url from 'url';
import http from 'http';
import https from 'https';
import helpers from './lib/helpers.js';
import data from './lib/data.js';
import config from './config.js';

const loopInterval = userData.paidAccount ? config.paidInterval : config.freeInterval;
const workers = {};

//Sanity checking of the monitor data
workers._validate = check => {
    check = typeof check === 'object' && check !== null ? check : {};
    const id = typeof check.id === 'string' && check.id.length === 20 ? check.id : null;
    const userPhone = typeof check.userPhone === 'string' && check.userPhone.length === 10 ? check.userPhone : null;
    const protocol = typeof check.protocol === 'string' && ['http', 'https'].includes(check.protocol) ? check.protocol : null;
    const url = typeof check.url === 'string' && check.url.trim().length > 0 ? check.url.trim() : null;
    const method = typeof check.method === 'string' && ['get', 'post', 'put', 'delete'].includes(check.method.toLowerCase()) ? check.method : null;
    const successCodes = typeof check.successCodes === 'object' && check.successCodes instanceof Array && check.successCodes.length > 0 ? check.successCodes : null;
    const timeoutSeconds = typeof check.timeoutSeconds === 'number' && check.timeoutSeconds > 1 && check.timeoutSeconds <= 5 && check.timeoutSeconds % 1 === 0 ? check.timeoutSeconds : null;

    // Set the keys that not be set in the check initially (the worker never run the check before)
    state = typeof check.state === 'string' && ['up', 'down'].includes(check.state) ? check.state : 'down';
    lastChecked = typeof check.lastChecked === 'number' && check.lastChecked > 0 ? check.lastChecked : null;

    if (id && userPhone&& protocol && url && method && successCodes && timeoutSeconds) {
        workers.perform(check);
    } else {
        console.error("The check is malformed");
    }
};

workers.perform = check => {
    
};

workers._runAllChecks = () => {
    data.list('checks', (err, checkList) => {
        if (!err && checkList && checkList.length > 0) {
            checkList.forEach(check => {
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        workers._validate(originalCheckData);
                    } else {
                        console.error(`Could not read the monitor id ${check}`);
                    }
                });
            });
        } else {
            console.error('Error gathering list of monitors');
        }
    });
};

workers._loop = () => {
    setInterval(() => {
        workers._runAllChecks();
    }, loopInterval)
};

workers.init = () => {
    // initial checks
    workers._runAllChecks();

    // loop performance of all the checks in intervals
    workers._loop()
};


export default workers;
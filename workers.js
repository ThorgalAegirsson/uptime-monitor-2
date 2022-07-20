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
workers._valiate = check => {
    
};

workers._runAllChecks = () => {
    data.list('checks', (err, checkList) => {
        if (!err && checkList && checkList.length > 0) {
            checkList.forEach(check => {
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        workers._valiate(originalCheckData);
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
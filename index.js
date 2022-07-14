/**
 * Primary file for the API
 * 
 */

// Dependencies
import http from 'http';
import https from 'https';
import fs from 'fs';

import config from './config.js';
import unifiedServer from './server.js';
import _data from './lib/data.js';

// test data library
// @TODO delete this test
// _data.create('test', 'newFile', { foo: 'bar' }, err => {
//     err && console.error(`There was an error: ${err}`);
// });
// _data.read('test', 'newFile1', (err, data) => {
//     err && console.error(`There was an error: ${err}`);
//     data && console.log(`This is the retrieved data: ${data}`);
// });
// _data.update('test', 'newFile', { foo: 'bu' }, err => {
//     err && console.error(`There was an error: ${err}`);
// });
// _data.delete('test', 'newFile', err => {
//     err && console.error(`There was an error: ${err}`);
// });

// Run HTTP servers
const httpServer = http.createServer(unifiedServer);

httpServer.listen(config.httpPort, () => {
    console.log(`The HTTP server is listening on port ${config.httpPort} in ${config.envName} mode`);
});

// Run HTTPS server
const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

httpsServer.listen(config.httpsPort, () => {
    console.log(`The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} mode`);
});



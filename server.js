/**
 *  SERVER related tasks
 * 
 */

// Dependencies
import http from 'http';
import https from 'https';
import fs from 'fs';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import handlers from './lib/requestHandlers.js';
import helpers from './lib/helpers.js';
import config from './config.js';

const server = {};

// Define a request router
const _router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks,
    notFound: handlers.notFound
};

// Common logic for http and https servers
const unifiedServer = (req, res) => {

    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the req details
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    const method = req.method.toUpperCase();
    const queryStringObject = parsedUrl.query;
    const headers = req.headers;

    // read the payload from request
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // send the response

        //choose the request handler
        const chosenHandler = typeof _router[trimmedPath] !== 'undefined' ? _router[trimmedPath] : handlers.notFound;

        // create a data object sent to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            headers,
            method,
            payload: helpers.parseJsonToObject(buffer)
        };

        // route the request to the proper handler
        chosenHandler(data, (statusCode, payload) => {
            statusCode = typeof statusCode === 'number' ? statusCode : 200;
            payload = typeof payload === 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);

            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(`Response returned: ${statusCode} ${payloadString}`);
        });
    })
};

const _httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};



server.httpServer = http.createServer(unifiedServer);

server.httpsServer = https.createServer(_httpsServerOptions, unifiedServer);

server.init = () => {
    server.httpServer.listen(config.httpPort, () => {
        console.log(`The HTTP server is listening on port ${config.httpPort} in ${config.envName} mode`);
    });

    server.httpsServer.listen(config.httpsPort, () => {
        console.log(`The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} mode`);
    });
};

export default server;
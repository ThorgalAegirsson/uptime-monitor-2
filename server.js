import url from 'url';
import { StringDecoder } from 'string_decoder';
import handlers from './lib/routeHandlers.js';




// Define a request router
const router = {
    ping: handlers.ping,
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
        const chosenHandler = typeof router[trimmedPath] !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // create a data object sent to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            headers,
            method,
            payload: buffer
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

export default unifiedServer;
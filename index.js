/**
 * Primary file for the API
 * 
 */

// Dependencies
import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';


// Define router handlers
const handlers = {
    sample: (data, callback) => {
        callback(406, { name: 'sample handler' });
    },
    notFound: (data, callback) => {
        callback(404);
    }
};


// Define a request router
const router = {
    sample: handlers.sample,
    notFound: handlers.notFound
};

const server = http.createServer((req, res) => {

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
});

server.listen(3000, () => {
    console.log('The server is listening on port 3000');
});



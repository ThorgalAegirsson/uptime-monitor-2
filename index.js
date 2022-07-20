/**
 * Primary file for the API
 * 
 */

// Dependencies
import server from './server.js';
import workers from './workers.js';

const app = {};

app.init = () => {
    server.init();

    // workers.init();
};

app.init();

export default app;
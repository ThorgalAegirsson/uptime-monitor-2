/**
 * Create and export configuration variables
 * 
 */

// Container for all the environments
const environments = {};

// Staging object
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging'
};

// Production object
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production'
};

// Determine the environment to use and export it
const currEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging';

const envToExport = typeof environments[currEnv] === 'object' ? environments[currEnv] : environments.staging;

export default envToExport;
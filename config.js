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
    envName: 'staging',
    hashingSecret: 'thisIsASecret',
    maxFreeChecks: 5,
    maxPaidChecks: 100,
    twilio: {
        accountSid: 'AC8dbc224e5c3b5b6a4f31e451f4f7d0f6',
        authToken: '53df31ce85a240d7f44e2be4dbdf321d',
        fromPhone: '+18482855763'
    }
};

// Production object
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'thisIsAlsoASecret', 
    maxFreeChecks: 5,
    maxPaidChecks: 100,
    twilio: {
        accountSid: 'AC8dbc224e5c3b5b6a4f31e451f4f7d0f6',
        authToken: '53df31ce85a240d7f44e2be4dbdf321d',
        fromPhone: '+18482855763'
    }
};

// Determine the environment to use and export it
const currEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging';

const envToExport = typeof environments[currEnv] === 'object' ? environments[currEnv] : environments.staging;

export default envToExport;
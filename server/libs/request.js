const {WORKFLOW_SERVICE, WORKFLOW_BASIC_AUTH} = require('../config').forContext('server');
const {isProduction} = require('../config');
const axios = require('axios');
const https = require('https');
const fs = require('fs');

const getHttpsClient = () => {
    return new https.Agent({
        ca: fs.readFileSync('/etc/ssl/certs/ca-bundle.crt')
    });
};

const workflowServiceClient = axios.create({
    baseURL: WORKFLOW_SERVICE,
    auth: WORKFLOW_BASIC_AUTH,
    httpsAgent: isProduction ? getHttpsClient() : null
});

module.exports = {
    workflowServiceClient
};
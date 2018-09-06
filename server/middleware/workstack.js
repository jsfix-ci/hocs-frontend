const { caseworkServiceClient } = require('../libs/request');

async function workstackMiddleware(req, res, next) {
    try {
        const response = await caseworkServiceClient.get('/stage/active');
        res.locals.workstack = response.data.activeStages;
        next();
    } catch (e) {
        throw new Error('Unable to retrieve workstack');
    }
}

async function apiWorkstackMiddleware(req, res) {
    try {
        const response = await caseworkServiceClient.get('/stage/active', { responseType: 'stream' });
        response.data.pipe(res);
    } catch (e) {
        throw new Error('Unable to retrieve workstack');
    }
}

module.exports = {
    workstackMiddleware,
    apiWorkstackMiddleware
};
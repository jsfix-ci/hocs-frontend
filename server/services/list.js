const { DOCUMENT_WHITELIST } = require('../config').forContext('server');
const { infoServiceClient } = require('../libs/request');
const logger = require('../libs/logger');
const { listDefinitions, staticListDefinitions } = require('./lists/index');

const listRepository = {};

async function initialise() {
    const listRequests = Object.entries(staticListDefinitions).reduce((reducer, [key, value]) => {
        logger.info(`Fetching list: ${key}`);
        reducer.push({ key, request: fetchList(value) });
        return reducer;
    }, []);

    await listRequests.map(async ({ list, request }) => {
        try {
            const response = await request;
            handleListSuccess(list, response);
        } catch (error) {
            handleListFailure(list, error);
        }
    });
}

function fetchList(listEndpoint, options) {
    logger.info(`Fetching list: ${listEndpoint}`);
    return infoServiceClient.get(listEndpoint, options);
}

function handleListSuccess(listId, response) {
    logger.info(`Successfully fetched list: ${listId}`);
    listRepository[listId] = response.data[listId] || [];
}

function handleListFailure(listId, error) {
    logger.error(`Unable to retrieve list ${listId}: ${error.message}`);
}
// Cache miss pattern for static lists
// if (listRepository.workflowTypes) {
//     return listRepository.workflowTypes;
// } else {
//     const list = 'workflowTypes';
//     logger.info(`List ${list} unavailable, attempting to retrieve`);
//     try {
//         const response = await fetchList(list);
//         handleListSuccess(list, response);
//         return response.data.workflowTypes
//             .filter(listItem => User.hasRole(user, listItem.requiredRole));
//     } catch (err) {
//         handleListFailure(list, err);
//     }
// }

function compareListItems(first, second) {
    const firstLabel = first.label.toUpperCase();
    const secondLabel = second.label.toUpperCase();
    return (firstLabel < secondLabel) ? -1 : 1;
}

const lists = {
    'CASE_TYPES': async ({ user }) => {
        const list = listDefinitions['workflowTypes'].call(this);
        try {
            const headerRoles = user.roles.join();
            logger.info(`Roles ${headerRoles}`);
            const response = await fetchList(list, {
                headers: {
                    'X-Auth-Roles': headerRoles
                }
            });
            logger.info(JSON.stringify(response.data));
            return response.data.caseTypes.sort(compareListItems);
        } catch (error) {
            handleListFailure(list, error);
        }

    },
    'CASE_TYPES_BULK': async ({ user }) => {
        const list = listDefinitions['workflowTypesBulk'].call(this);
        try {
            const headerRoles = user.roles.join();
            logger.info(`Roles ${headerRoles}`);
            const response = await fetchList(list, {
                headers: {
                    'X-Auth-Roles': headerRoles
                }
            });
            return response.data.caseTypes.sort(compareListItems);
        } catch (error) {
            handleListFailure(list, error);
        }

    },
    'DOCUMENT_EXTENSION_WHITELIST': async () => {
        return DOCUMENT_WHITELIST;
    },
    'MEMBER_LIST': async ({ user }) => {
        const list = listDefinitions['memberList'].call(this, { caseType: 'MIN' });
        try {
            const headerRoles = user.roles.join();
            logger.info(`Roles ${headerRoles}`);
            const response = await fetchList(list, {
                headers: {
                    'X-Auth-Roles': headerRoles
                }
            });
            return response.data.members.sort(compareListItems);
        } catch (error) {
            handleListFailure(list, error);
        }
    },
    'CASE_STANDARD_LINES': async () => {
        // TODO: Implement me!!!
        return [
            { label: 'First', value: 'FIRST' },
            { label: 'Second', value: 'SECOND' }
        ];
    },
    'CASE_TEMPLATES': async () => {
        // TODO: Implement me!!!
        return [
            { label: 'First', value: 'FIRST' },
            { label: 'Second', value: 'SECOND' }
        ];
    },
    'CASE_PARENT_TOPICS': async () => {
        // TODO: Implement me!!!
        return [
            { label: 'Parent topic A', value: 'A' },
            { label: 'Parent topic B', value: 'B' }
        ];
    },
    'CASE_TOPICS': async () => {
        // TODO: Implement me!!!
        return [
            { label: 'Child topic A', value: 'A' },
            { label: 'Child topic B', value: 'B' }
        ];
    }
};

async function getList(list, options) {
    try {
        return await lists[list.toUpperCase()].call(this, options);
    } catch (e) {
        throw new Error(`Unable to get list for ${list}: ${e}`);
    }
}

module.exports = {
    getList,
    initialise
};
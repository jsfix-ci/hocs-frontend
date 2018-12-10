const { workflowServiceClient, infoServiceClient, caseworkServiceClient, docsServiceClient } = require('../libs/request');
const actionTypes = require('./actions/types');
const { ActionError } = require('../models/error');
const logger = require('../libs/logger');
const events = require('../models/events');

function createDocumentSummaryObjects(form, type) {
    return form.schema.fields.reduce((reducer, field) => {
        if (field.component === 'add-document' && form.data[field.props.name]) {
            form.data[field.props.name].map(file => {
                reducer.push({
                    displayName: file.originalname,
                    type: type,
                    s3UntrustedUrl: file.key || 'key'
                });
            });
        }
        return reducer;
    }, []);
}

function createCaseRequest(type, form) {
    return {
        type,
        dateReceived: form.data['DateReceived'],
        documents: createDocumentSummaryObjects(form, 'ORIGINAL')
    };
}

function addDocumentRequest(form) {
    return { documents: createDocumentSummaryObjects(form, form.data['document_type']) };
}

function createCase(url, { caseType, form }, headers) {
    return workflowServiceClient.post(url, createCaseRequest(caseType, form), headers);
}

function addDocument(url, form, headers) {
    return workflowServiceClient.post(url, addDocumentRequest(form),headers);
}

function updateCase({ caseId, stageId, form }, headers) {
    return workflowServiceClient.post(`/case/${caseId}/stage/${stageId}`, { data: form.data }, headers);
}

function handleActionSuccess(response, workflow, form) {
    const { next, data } = form;
    if (response && response.callbackUrl) {
        return { callbackUrl: response.callbackUrl };
    }
    if (next && next.action) {
        if (next.action === 'CONFIRMATION_SUMMARY') {
            return { confirmation: response };
        }
        if (next.context) {
            const context = data[next.context.field];
            return { callbackUrl: `/action/${workflow}/${context}/${next.action}` };
        }
        return { callbackUrl: `/action/${workflow}/${next.action}` };
    } else {
        return { callbackUrl: '/' };
    }
}

function handleWorkflowSuccess(response, { caseId, stageId }) {
    if (response.data && response.data.form) {
        return { callbackUrl: `/case/${caseId}/stage/${stageId}` };
    } else {
        return { callbackUrl: '/' };
    }
}

const actions = {
    ACTION: async ({ workflow, context, form, user }) => {
        let headers = {};
        headers.headers = {
            'X-Auth-UserId': user.id,
            'X-Auth-Roles': user.roles.join(),
            'X-Auth-Groups': user.groups.join()
        };
        try {
            if (form && form.action) {
                logger.info({ event: events.ACTION, user: user.username, action: form.action });
                let response;
                let clientResponse;
                switch (form.action) {
                case actionTypes.CREATE_CASE:
                    response = await createCase('/case', { caseType: context, form }, headers);
                    clientResponse = { summary: `Created a new case: ${response.data.reference}` };
                    return handleActionSuccess(clientResponse, workflow, form);
                case actionTypes.BULK_CREATE_CASE:
                    response = await createCase('/case/bulk', { caseType: context, form }, headers);
                    clientResponse = { summary: `Created ${response.data.count} new case${response.data.count > 1 ? 's' : ''}` };
                    return handleActionSuccess(clientResponse, workflow, form);
                case actionTypes.ADD_STANDARD_LINE:
                    /* eslint-disable no-case-declarations */
                    const document = form.data.document[0];
                    const request = {
                        s3UntrustedUrl: document.key,
                        displayName: document.originalname,
                        topicUUID: form.data['topic'],
                        expires: form.data['expiry_date']
                    };
                    response = await infoServiceClient.post('/standardline/document', request, headers);
                    clientResponse = { summary: 'Created a new standard line' };
                    return handleActionSuccess(clientResponse, workflow, form);
                case actionTypes.ADD_TEMPLATE:
                    /* eslint-disable no-case-declarations */
                    const document1 = form.data.document[0];
                    const request1 = {
                        s3UntrustedUrl: document1.key,
                        displayName: document1.originalname,
                        caseType: form.data['caseType']
                    };
                    response = await infoServiceClient.post('/template/document', request1, headers);
                    clientResponse = { summary: 'Created a new template' };
                    return handleActionSuccess(clientResponse, workflow, form);
                    /* eslint-enable no-case-declarations */
                }
            } else {
                return handleActionSuccess(null, workflow, form);
            }
        } catch (e) {
            logger.error({ event: events.ACTION_FAILURE, user: user.username, action: form.action });
            throw new ActionError(e);
        }
    },
    CASE: async ({ caseId, stageId, entity, context, form, user }) => {
        let headers = {
            headers: {
                'X-Auth-UserId': user.id,
                'X-Auth-Roles': user.roles.join(),
                'X-Auth-Groups': user.groups.join()
            }
        };
        try {
            if (form && form.action && entity) {
                logger.info({ event: events.CASE_ACTION, user: user.username, action: form.action, case: caseId });
                switch (form.action) {
                case actionTypes.ADD_DOCUMENT:
                    await addDocument(`/case/${caseId}/document`, form, headers);
                    break;
                case actionTypes.REMOVE_DOCUMENT:
                    if (!context) {
                        throw new ActionError('Unable to remove, no context provided');
                    }
                    await docsServiceClient.delete(`/case/${caseId}/document/${context}`, headers);
                    break;
                case actionTypes.ADD_TOPIC:
                    await caseworkServiceClient.post(`/case/${caseId}/topic`, { topicUUID: form.data['topic'] },headers);
                    break;
                case actionTypes.REMOVE_TOPIC:
                    if (!context) {
                        throw new ActionError('Unable to remove, no context provided');
                    }
                    await caseworkServiceClient.delete(`/case/${caseId}/topic/${context}`, headers);
                    break;
                case actionTypes.IS_MEMBER:
                    if (form.data['isMember'] === 'true') {
                        return ({ callbackUrl: `/case/${caseId}/stage/${stageId}/entity/member/add` });
                    } else {
                        return ({ callbackUrl: `/case/${caseId}/stage/${stageId}/entity/correspondent/details` });
                    }
                case actionTypes.SELECT_MEMBER:
                    return ({ callbackUrl: `/case/${caseId}/stage/${stageId}/entity/member/${form.data['member']}/details` });
                case actionTypes.ADD_CORRESPONDENT: case actionTypes.ADD_MEMBER:
                    await caseworkServiceClient.post(`/case/${caseId}/correspondent`, { ...form.data }, headers);
                    return ({ callbackUrl: `/case/${caseId}/stage/${stageId}` });
                case actionTypes.REMOVE_CORRESPONDENT:
                    if (!context) {
                        throw new ActionError('Unable to remove, no context provided');
                    }
                    await caseworkServiceClient.delete(`/case/${caseId}/correspondent/${context}`, headers);
                    break;
                }
                return ({ callbackUrl: `/case/${caseId}/stage/${stageId}` });
            }
        } catch (e) {
            logger.error({ event: events.CASE_ACTION_FAILURE, user: user.username, action: form.action, case: caseId });
            throw new ActionError(e);
        }
    },
    WORKFLOW: async ({ caseId, stageId, form, user }) => {
        let headers = {};
        headers.headers = {
            'X-Auth-UserId': user.id,
            'X-Auth-Roles': user.roles.join(),
            'X-Auth-Groups': user.groups.join()
        };
        logger.info({ event: events.WORKFLOW_ACTION, user: user.username, action: actionTypes.UPDATE_CASE, case: caseId });
        try {
            const response = await updateCase({ caseId, stageId, form }, headers);
            return handleWorkflowSuccess(response, { caseId, stageId });
        } catch (e) {
            logger.error({ event: events.WORKFLOW_ACTION_FAILURE, user: user.uuid, action: actionTypes.UPDATE_CASE, case: caseId });
            throw new ActionError(e);
        }
    }
};

const performAction = (type, options) => {
    return actions[type].call(this, options);
};

module.exports = {
    performAction
};

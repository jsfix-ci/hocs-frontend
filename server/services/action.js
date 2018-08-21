const logger = require('../libs/logger');
const { workflowServiceClient } = require('../libs/request');
const { CREATE_CASE, BULK_CREATE_CASE } = require('./actions/types');

function createDocumentSummaryObjects(form) {
    return form.schema.fields.reduce((reducer, field) => {
        if (field.component === 'add-document') {
            if (form.data[field.props.name]) {
                form.data[field.props.name].map(file => {
                    reducer.push({
                        displayName: file.originalname,
                        type: field.props.documentType,
                        s3UntrustedUrl: file.location || 'location'
                    });
                });
            }
        }
        return reducer;
    }, []);
}

function createCaseRequest(type, form) {
    return {
        type,
        dateReceived: form.data['DateReceived'],
        documents: createDocumentSummaryObjects(form)
    };
}

function createCase(url, { caseType, form }) {
    return workflowServiceClient.post(url,createCaseRequest(caseType, form));
}

function updateCase({ caseId, stageId, form }) {
    return workflowServiceClient.post(`/case/${caseId}/stage/${stageId}`, { data: form.data });
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

function handleActionFailure(error) {
    logger.error(error);
    return { error };
}

function handleWorkflowError(error) {
    logger.error(error);
    return { error };
}

const actions = {
    ACTION: async ({ workflow, context, form }) => {
        if (form && form.action) {
            switch (form.action) {
            case CREATE_CASE:
                try {
                    const response = await createCase('/case', { caseType: context, form });
                    const clientResponse = { summary: `Created case ${response.data.reference}` };
                    return handleActionSuccess(clientResponse, workflow, form);
                } catch (err) {
                    return handleActionFailure(err);
                }
            case BULK_CREATE_CASE: {
                try {
                    const response = await createCase('/case/bulk', { caseType: context, form });
                    const clientResponse = { summary: `Submitted ${response.data.count} file${response.data.count > 1 ? 's': ''}` };
                    return handleActionSuccess(clientResponse, workflow, form);
                } catch (err) {
                    return handleActionFailure(err);
                }
            }
            default: {
                return handleActionFailure({ message: 'Unsupported action' });
            }
            }
        } else {
            return handleActionSuccess(null, workflow, form);
        }
    },
    CASE: async ({ entity, action }) => {
        if (entity && action) {
            // Handle case event
        }
    },
    WORKFLOW: async ({ caseId, stageId, entity, action, form }) => {
        if (entity && action) {
            // Handle case event
        }
        // Update stage

        try {
            const response = await updateCase({ caseId, stageId, form });
            return handleWorkflowSuccess(response, { caseId, stageId });
        } catch (err) {
            return handleWorkflowError(err);
        }
    }
};

const performAction = (type, options) => {
    return actions[type].call(this, options);
};

module.exports = {
    performAction
};
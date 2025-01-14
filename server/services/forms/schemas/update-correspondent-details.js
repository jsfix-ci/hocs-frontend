const Form = require('../form-builder');
const { Component, Choice } = require('../component-builder');
const { caseworkService } = require('../../../clients');
const User = require('../../../models/user');

module.exports = async ({ caseId, stageId, context, user, requestId }) => {
    const { data: { address, ...data } } = await caseworkService.get(`/case/${caseId}/correspondent/${context}`, { headers: { ...User.createHeaders(user), 'X-Correlation-Id': requestId } });
    return Form()
        .withTitle('Edit correspondent details')
        .withField(
            Component('text', 'fullname')
                .withValidator('required', 'The correspondent\'s full name is required')
                .withProp('label', 'Full name')
                .build()
        )
        .withField(
            Component('text', 'organisation')
                .withProp('label', 'Organisation')
                .build()
        )
        .withField(
            Component('text', 'address1')
                .withProp('label', 'Address line 1')
                .build()
        )
        .withField(
            Component('text', 'address2')
                .withProp('label', 'Address line 2')
                .build()
        )
        .withField(
            Component('text', 'address3')
                .withProp('label', 'Town or city')
                .build()
        )
        .withField(
            Component('text', 'postcode')
                .withProp('label', 'Postcode')
                .build()
        )
        .withField(
            Component('dropdown', 'country')
                .withProp('label', 'Country')
                .withProp('choices', [
                    Choice('United Kingdom', 'United Kingdom'),
                    Choice('Other', 'Other')
                ])
                .build()
        )
        .withField(
            Component('text', 'telephone')
                .withProp('label', 'Telephone')
                .build()
        )
        .withField(
            Component('text', 'email')
                .withProp('label', 'Email')
                .build()
        )
        .withField(
            Component('text-area', 'reference')
                .withProp('label', 'Enter any references given')
                .build()
        )
        .withField(
            Component('hidden', 'externalKey')
                .withProp('label', 'External member reference')
                .build()
        )
        .withPrimaryActionLabel('Save')
        .withSecondaryAction(
            Component('backlink')
                .withProp('label', 'Back')
                .withProp('action', `/case/${caseId}/stage/${stageId}`)
                .build()
        )
        .withData({ ...address, ...data })
        .build();
};

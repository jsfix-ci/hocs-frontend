import React from 'react';
import { ApplicationProvider } from '../../../contexts/application.jsx';
import FormEmbeddedWrapped from '../../forms/form-embedded-wrapped.jsx';

describe('Form embedded wrapped component', () => {

    const config = {
        caseData: {
            PaymentTypeConsolatory: true,
            PaymentTypeExGratia: true,
            AmountComplainantRequested: 100,
            AmountBusinessRequested: 50,
            OfferSentToComplainant: 50,
            BusinessApprovedPayment: false,
            ComplainantAccepted: false
        },
        page: {
            params: {
                caseId: '12345678-12345-12345-12345678'
            }
        }
    };

    const page = {
            params: {
                caseId: '12345678-12345-12345-12345678'
            }
        },
        schema = {},
        dispatch = (() => {}),
        fieldData = {},
        submitHandler = (() => {}),
        action = '',
        baseUrl = '';


    it('should render with default props', () => {
        const wrapper = render(
            <ApplicationProvider config={config}>
                <FormEmbeddedWrapped
                    page={page}
                    schema={schema}
                    dispatch={dispatch}
                    fieldData={fieldData}
                    submitHandler={submitHandler}
                    action={action}
                    baseUrl={baseUrl}
                />
            </ApplicationProvider>
        );
        expect(wrapper).toBeDefined();
    });
});
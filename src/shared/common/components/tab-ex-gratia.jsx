import React, { useContext, useEffect, Fragment, useCallback, useState } from 'react';
import { Context } from '../../contexts/application.jsx';
import PropTypes from 'prop-types';
import status from '../../helpers/api-status';
import { updateApiStatus } from '../../contexts/actions/index.jsx';
import types from '../../contexts/actions/types.jsx';
import getCaseData from '../../helpers/case-data-helper';
import axios from 'axios';
import FormEmbeddedWrapped from '../forms/form-embedded-wrapped.jsx';

const TabExGratia = () => {
    const { caseData, dispatch, page } = useContext(Context);
    const [form, setForm] = useState(null);
    const [displayData, setDisplayData] = useState({});

    // update when updates are sent to the api
    const fetchCaseData = useCallback(() => {
        dispatch(updateApiStatus(status.REQUEST_CASE_DATA));
        getCaseData(page.params.caseId, dispatch);
    }, [getCaseData]);

    useEffect(() => {
        fetchCaseData();
    }, [fetchCaseData]);

    useEffect(() => {
        getForm();
    }, []);

    useEffect(() => {
        setDisplayData(caseData);
    }, [caseData]);

    const getForm = () => {
        dispatch(updateApiStatus(status.REQUEST_FORM))
            .then(() => axios.get('/api/schema/EX_GRATIA/fields'))
            .then(response => setForm(response))
            .then(() => dispatch(updateApiStatus(status.REQUEST_FORM_SUCCESS)));
    };

    return (
        <Fragment>
            {(caseData && Object.keys(caseData).length !== 0) &&
            <Fragment>
                <h2 className='govuk-heading-m'>Ex-Gratia</h2>
                <details className='govuk-details'>
                    <summary className='govuk-details__summary'>
                        <span className='govuk-details__summary-text'>
                            Update Ex-Gratia details
                        </span>
                    </summary>

                    {form && form.data != null &&
                        <FormEmbeddedWrapped
                            schema={{ fields: form.data }}
                            fieldData={caseData}
                            action={types.UPDATE_CASE_ACTION_DATA}
                            setLinkedDisplayData={setDisplayData}
                        />
                    }
                </details>
                <table className='govuk-table margin-left--small'>
                    <caption className='govuk-table__caption margin-bottom--small' >Summary</caption>
                    <tbody className='govuk-table__body'>
                        {caseData.PaymentTypeConsolatory !== undefined && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Consolatory</th>
                            <td className='govuk-table__cell'>{caseData.PaymentTypeConsolatory ? 'Yes' : 'No'}</td>
                        </tr>}
                        {caseData.PaymentTypeExGratia !== undefined && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Ex-Gratia</th>
                            <td className='govuk-table__cell'>{caseData.PaymentTypeExGratia ? 'Yes' : 'No'}</td>
                        </tr>}
                        {caseData.AmountComplainantRequested && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Amount complainant has requested:</th>
                            <td className='govuk-table__cell'>{caseData.AmountComplainantRequested}</td>
                        </tr>}
                        {caseData.AmountBusinessRequested && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Amount requested from the business/port:</th>
                            <td className='govuk-table__cell'>{caseData.AmountBusinessRequested}</td>
                        </tr>}
                        {caseData.OfferSentToComplainant && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Offer sent to the complainant:</th>
                            <td className='govuk-table__cell'>{caseData.OfferSentToComplainant}</td>
                        </tr>}
                        {caseData.BusinessApprovedPayment !== undefined && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Business area/port has approved payment:</th>
                            <td className='govuk-table__cell'>{caseData.BusinessApprovedPayment ? 'Yes' : 'No'}</td>
                        </tr>}
                        {caseData.ComplainantAccepted !== undefined && <tr className='govuk-table__cell'>
                            <th className='govuk-table__header padding-left--small govuk-!-width-one-third'>Complainant has accepted:</th>
                            <td className='govuk-table__cell'>{caseData.ComplainantAccepted ? 'Yes' : 'No'}</td>
                        </tr>}
                    </tbody>
                </table>
            </Fragment>
            }
        </Fragment>
    );
};

TabExGratia.propTypes = {
    correspondents: PropTypes.array,
    page: PropTypes.object,
    summary: PropTypes.object
};

export default TabExGratia;

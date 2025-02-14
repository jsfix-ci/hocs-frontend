import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Context } from '../../contexts/application.jsx';
import PropTypes from 'prop-types';

const ExternalInterest = (props) => {
    const { page } = useContext(Context);
    const { EXTERNAL_INTEREST } = props.props;

    const getCurrentInterests = (EXTERNAL_INTEREST) => {

        const currentAppealTypeList = EXTERNAL_INTEREST.filter(interest => interest.typeData.length > 0).map(appeal => {
            return {
                label: appeal.typeInfo.actionLabel,
                interestsOfType: [ ...appeal.typeData ]
            };
        });

        const externalInterestArray = [];

        for (let typeData of currentAppealTypeList) {

            typeData.interestsOfType.map(interestData => {
                return externalInterestArray.push({
                    id: interestData.uuid,
                    interestedPartyLabel: interestData.interestedPartyEntity.title,
                    detailsOfInterest: interestData.detailsOfInterest
                });
            });
        }

        if (externalInterestArray.length < 1) {
            return (
                <>
                </>
            );
        }

        return (
            <>
                <p className='govuk-body'>Recorded Interests:</p>
                <table className='govuk-table'>
                    { externalInterestArray.length > 0 &&
                        externalInterestArray.map((externalInterest, i)=> {
                            return (
                                <tr className='govuk-table__row' key={i}>
                                    <td key={i} className='govuk-table__cell width-one-sixth'>
                                        { externalInterest.interestedPartyLabel }
                                    </td>
                                    <td key={i} className='govuk-table__cell govuk-!-width-one-half'>
                                        { externalInterest.detailsOfInterest }
                                    </td>
                                    <td key={i} className='govuk-table__cell'>
                                        <Link to={`/case/${page.params.caseId}/stage/${page.params.stageId}/caseAction/record_interest/update/${externalInterest.id}?hideSidebar=false`}
                                            className="govuk-link">Update</Link>
                                    </td>
                                </tr>
                            );
                        })
                    }
                </table>
            </>
        );
    };

    return (
        <>
            <h3 className="govuk-heading-s">Record Interest</h3>
            { getCurrentInterests(EXTERNAL_INTEREST) }
            <p className='govuk-body'>Record interest against the case</p>

            <Link className='govuk-body govuk-link' to={`/case/${page.params.caseId}/stage/${page.params.stageId}/caseAction/record_interest/add`}>
                        Record Interest
            </Link>
        </>
    );
};

export default ExternalInterest;

ExternalInterest.propTypes = {
    props: PropTypes.object,
    EXTERNAL_INTEREST: PropTypes.array
};

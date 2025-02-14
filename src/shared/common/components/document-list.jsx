import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

class DocumentList extends Component {

    constructor(props) {
        super(props);
    }

    _onClick(e, document) {
        e.preventDefault();
        this.props.clickHandler(document);
    }

    render() {
        const { activeDocument, caseId, stageId, documents } = this.props;
        return (
            <>
                {Array.isArray(documents) && documents.map(([groupName, groupedDocuments]) => (
                    <Fragment key={groupName}>
                        <h2 className='govuk-heading-m'>{groupName}</h2>
                        <table className='govuk-table'>
                            <tbody className='govuk-table__body'>
                                {
                                    caseId && Array.isArray(groupedDocuments) && groupedDocuments.map(({ label, tags, value, hasPdf, hasOriginalFile }, i) => (
                                        <tr key={i} className='govuk-table__row'>
                                            <td className='govuk-table__cell govuk-!-width-full'>
                                                {label}
                                            </td>
                                            {Array.isArray(tags) && <td className='govuk-table__cell govuk-!-width-one-quarter'>
                                                {tags.map(tag =>
                                                    <strong key={tag} className='govuk-tag margin-right--small'>
                                                        {tag}
                                                    </strong>
                                                )}
                                            </td>
                                            }
                                            <td className='govuk-table__cell'>
                                                {value && hasPdf && caseId && activeDocument !== value &&
                                                    <a
                                                        id={`${value}-pdf`}
                                                        href={`/case/${caseId}/stage/${stageId}/download/document/${value}/pdf`}
                                                        className='govuk-link'
                                                        onClick={e => this._onClick(e, `${value}`)}
                                                    >
                                                        Preview
                                                    </a>
                                                }
                                            </td>
                                            <td className='govuk-table__cell'>
                                                {value && hasOriginalFile && caseId &&
                                                    <a
                                                        href={`/case/${caseId}/stage/${stageId}/download/document/${value}/original`}
                                                        className='govuk-link'
                                                        download={label}
                                                    >
                                                        Download
                                                    </a>
                                                }
                                            </td>
                                        </tr>
                                    ))
                                }
                                {(!Array.isArray(groupedDocuments) || groupedDocuments.length === 0) && <tr className='govuk-table__row'>
                                    <td className='govuk-table__cell'>None</td>
                                </tr>}
                            </tbody>
                        </table>
                    </Fragment>
                ))}
            </>
        );
    }
}

DocumentList.defaultProps = {
    documents: []
};

DocumentList.propTypes = {
    activeDocument: PropTypes.string,
    caseId: PropTypes.string,
    clickHandler: PropTypes.func.isRequired,
    documents: PropTypes.array.isRequired,
    stageId: PropTypes.string
};

export default DocumentList;

import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// TODO: Tidy up and implement context to dispatch errors when failed to retrieve
class Workstack extends Component {

    constructor(props) {
        super(props);
        this.state = { cases: [] };
    }

    componentDidMount() {
        axios.get('/case/active')
            .then(res => {
                this.setState({ cases: res.data });
            })
            .catch(err => {
                /* eslint-disable-next-line */
                console.error(`UNABLE TO RETRIEVE WORKSTACK: ${err.stack}`);
            });
    }

    render() {
        const cases = this.state.cases;
        return (
            <Fragment>
                <table className='govuk-table'>
                    <caption className='govuk-table__caption'>Workstack</caption>
                    <thead className='govuk-table__head'>
                        <tr className='govuk-radios govuk-table__row'>
                            <th className='govuk-table__header'>Type</th>
                            <th className='govuk-table__header'>Reference</th>
                            <th className='govuk-table__header'>Stage</th>
                            <th className='govuk-table__header'>Actions</th>
                        </tr>
                    </thead>
                    <tbody className='govuk-table__body'>
                        {
                            cases.map((c, i) => {
                                return (
                                    <tr key={i} className='govuk-radios govuk-table__row'>
                                        <td className='govuk-table__cell'>
                                            <strong className='govuk-tag'>{c.caseType}</strong>
                                        </td>
                                        <td className='govuk-table__cell'>{c.caseReference}</td>
                                        <td className='govuk-table__cell'>{c.type}</td>
                                        <td className='govuk-table__cell'>
                                            <Link to={`/case/${c.caseUUID}/stage/${c.stageUUID}`} className="govuk-body govuk-link">View</Link>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </Fragment>
        );
    }
}

export default Workstack;
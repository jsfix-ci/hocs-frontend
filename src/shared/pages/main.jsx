import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Dashboard from '../pages/dashboard.jsx';

class MainPage extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="govuk-grid-row">
                <div className="govuk-grid-column-full">
                    <h1 className="govuk-heading-l">
                        My actions
                    </h1>
                    <ul className="govuk-list">
                        <li><Link to={'/action/create/workflow'}>Create single case</Link></li>
                        <li><Link to={'/action/bulk/workflow'}>Create cases in bulk</Link></li>
                        <li><Link to={'/action/test/form'}>View test form</Link></li>
                    </ul>
                    <Dashboard />
                </div>
            </div>
        );
    }
}

MainPage.propTypes = {
    caption: PropTypes.string,
    match: PropTypes.object,
    title: PropTypes.string
};

export default MainPage;
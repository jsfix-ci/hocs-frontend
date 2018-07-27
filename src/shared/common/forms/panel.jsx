import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Panel extends Component {
    /*
     * A visible container used on confirmation or results pages to highlight important content
     */
    render() {
        const { title, children } = this.props;

        return (
            <div className="govuk-panel govuk-panel--confirmation">
                <h1 className="govuk-panel__title">{title}</h1>
                <div className="govuk-panel__body">{children}</div>
            </div>
        );
    }
}

Panel.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string
};

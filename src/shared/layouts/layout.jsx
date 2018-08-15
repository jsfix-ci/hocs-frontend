import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Header from './components/header.jsx';
import Body from './components/body.jsx';
import Footer from './components/footer.jsx';
import Error from './error.jsx';
import { ApplicationConsumer } from '../contexts/application.jsx';
import { Redirect } from 'react-router-dom';

class Layout extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {
            apiStatus,
            children,
            error,
            layout: { header, body, footer }
        } = this.props;
        return (
            <Fragment>
                {apiStatus &&
                    <div className={`notification${apiStatus.status.type === 'ERROR' ? ' notification--error' : ''}`}>
                        {apiStatus.status.display}
                    </div>
                }
                <Header {...header} />
                <Body {...body} error={error}>
                    {error ? <Error {...error} /> : children}
                </Body>
                {footer.isVisible && <Footer {...footer} />}
                {this.props.redirect && <Redirect to={this.props.redirect} push />}
            </Fragment>
        );
    }
}

Layout.propTypes = {
    apiStatus: PropTypes.object,
    children: PropTypes.node,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object,
    error: PropTypes.object,
    layout: PropTypes.object.isRequired,
    redirect: PropTypes.string
};

Layout.defaultProps = {
};

const WrappedLayout = props => (
    <ApplicationConsumer>
        {({
            apiStatus,
            dispatch,
            redirect,
            error,
            layout
        }) => <Layout {...props} dispatch={dispatch} redirect={redirect} error={error} layout={layout} apiStatus={apiStatus} />}
    </ApplicationConsumer>
);

export default WrappedLayout;
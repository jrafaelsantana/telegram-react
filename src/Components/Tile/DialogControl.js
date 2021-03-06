/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import ChatTileControl from './ChatTileControl';
import DialogContentControl from './DialogContentControl';
import DialogBadgeControl from './DialogBadgeControl';
import DialogTitleControl from './DialogTitleControl';
import DialogMetaControl from './DialogMetaControl';
import ChatStore from '../../Stores/ChatStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './DialogControl.css';

const styles = theme => ({
    dialogActive: {
        color: '#fff',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '8px',
        cursor: 'pointer',
        margin: '0 12px'
    },
    dialog: {
        borderRadius: '8px',
        cursor: 'pointer',
        margin: '0 12px',
        '&:hover': {
            backgroundColor: theme.palette.primary.main + '11'
        }
    }
});

class DialogControl extends Component {
    constructor(props) {
        super(props);

        this.dialog = React.createRef();

        const chat = ChatStore.get(this.props.chatId);
        this.state = {
            chat: chat
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true;
        }

        if (nextProps.theme !== this.props.theme) {
            return true;
        }

        if (nextProps.hidden !== this.props.hidden) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        const { chatId } = this.props;

        if (chatId === update.previousChatId || chatId === update.nextChatId) {
            this.forceUpdate();
        }
    };

    handleSelect = () => {
        const { chatId, onSelect } = this.props;
        if (!chatId) return;
        if (!onSelect) return;

        onSelect(chatId);
    };

    render() {
        const { classes, chatId, showSavedMessages, hidden } = this.props;

        if (hidden) return null;

        const currentChatId = ApplicationStore.getChatId();
        const isSelected = currentChatId === chatId;

        return (
            <div
                ref={this.dialog}
                className={classNames(
                    isSelected ? classes.dialogActive : classes.dialog,
                    isSelected ? 'dialog-active' : 'dialog'
                )}
                onMouseDown={this.handleSelect}>
                <div className='dialog-wrapper'>
                    <ChatTileControl chatId={chatId} showSavedMessages={showSavedMessages} />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <DialogTitleControl chatId={chatId} />
                            <DialogMetaControl chatId={chatId} />
                        </div>
                        <div className='tile-second-row'>
                            <DialogContentControl chatId={chatId} />
                            <DialogBadgeControl chatId={chatId} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

DialogControl.propTypes = {
    chatId: PropTypes.number.isRequired,
    hidden: PropTypes.bool,
    showSavedMessages: PropTypes.bool
};

DialogControl.defaultProps = {
    hidden: false,
    showSavedMessages: true
};

export default withStyles(styles, { withTheme: true })(DialogControl);

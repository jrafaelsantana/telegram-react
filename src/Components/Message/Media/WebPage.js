/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Animation from './Animation';
import { getFitSize, getSize } from '../../../Utils/Common';
import { accentStyles } from '../../Theme';
import { getSrc } from '../../../Utils/File';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import './WebPage.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class WebPage extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateWebPageBlob', this.onClientUpdateWebPageBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateWebPageBlob', this.onClientUpdateWebPageBlob);
    }

    onClientUpdateWebPageBlob = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.forceUpdate();
        }
    };

    getContent = () => {
        const { chatId, messageId, size, displaySize, openMedia } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const { url, photo, animation } = web_page;

        if (animation) {
            const animationSrc = getSrc(animation.animation);
            if (animationSrc || animation.thumbnail) {
                return <Animation chatId={chatId} messageId={messageId} animation={animation} openMedia={openMedia} />;
            }
        }

        if (photo) {
            let src = '';
            let fitPhotoSize = {
                width: 0,
                height: 0
            };
            const photoSize = getSize(photo.sizes, size);
            if (photoSize) {
                fitPhotoSize = getFitSize(photoSize, displaySize);
                if (fitPhotoSize) {
                    const file = photoSize.photo;
                    const blob = FileStore.getBlob(file.id) || file.blob;
                    src = FileStore.getBlobUrl(blob);
                }
            }

            return (
                <div className='web-page-photo' style={fitPhotoSize} onClick={openMedia}>
                    <a href={url} title={url} target='_blank' rel='noopener noreferrer'>
                        <img className='photo-img' style={fitPhotoSize} src={src} alt='' />
                    </a>
                </div>
            );
        }

        return null;
    };

    render() {
        const { classes, chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const { site_name, title, description } = web_page;

        return (
            <div className='web-page'>
                <div className={classNames('web-page-border', classes.accentBackgroundLight)} />
                <div className='web-page-wrapper'>
                    {site_name && (
                        <div className={classNames('web-page-site-name', classes.accentColorDark)}>{site_name}</div>
                    )}
                    {title && <div className='web-page-title'>{title}</div>}
                    {description && <div className='web-page-description'>{description}</div>}
                    {this.getContent()}
                </div>
            </div>
        );
    }
}

WebPage.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number,
    openMedia: PropTypes.func
};

WebPage.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default withStyles(styles)(WebPage);

/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import packageJson from '../../package.json';
import { VERBOSITY_JS_MAX, VERBOSITY_JS_MIN, VERBOSITY_MAX, VERBOSITY_MIN } from '../Constants';
import TdClient from '@arseny30/tdweb/dist/tdweb';

class TdLibController extends EventEmitter {
    constructor() {
        super();

        this.parameters = {
            useTestDC: false,
            readOnly: false,
            verbosity: 1,
            jsVerbosity: 3,
            fastUpdating: true
        };

        this.setMaxListeners(Infinity);
    }

    init = location => {
        this.setParameters(location);

        const { verbosity, jsVerbosity, useTestDC, readOnly, fastUpdating } = this.parameters;

        let options = {
            logVerbosityLevel: verbosity,
            jsLogVerbosityLevel: jsVerbosity,
            mode: 'wasm', // 'wasm-streaming'/'wasm'/'asmjs'
            prefix: useTestDC ? 'tdlib_test' : 'tdlib',
            readOnly: readOnly,
            isBackground: false
            // onUpdate: update => this.emit('update', update)
        };

        console.log(
            `[TdLibController] (fast_updating=${fastUpdating}) Start client with params=${JSON.stringify(options)}`
        );

        this.client = new TdClient(options);
        this.client.onUpdate = update => {
            console.log('received', update);
            this.emit('update', update);
        };
    };

    clientUpdate = update => {
        console.log('clientUpdate', update);
        this.emit('clientUpdate', update);
    };

    setParameters = location => {
        if (!location) return;

        const { search } = location;
        if (!search) return;

        const params = new URLSearchParams(search.toLowerCase());

        if (params.has('test')) {
            const useTestDC = parseInt(params.get('test'), 10);
            if (useTestDC === 0 || useTestDC === 1) {
                this.parameters.useTestDC = useTestDC === 1;
            }
        }

        if (params.has('verbosity')) {
            const verbosity = parseInt(params.get('verbosity'), 10);
            if (verbosity >= VERBOSITY_MIN && verbosity <= VERBOSITY_MAX) {
                this.parameters.verbosity = verbosity;
            }
        }

        if (params.has('jsverbosity')) {
            const jsVerbosity = parseInt(params.get('jsverbosity'), 10);
            if (jsVerbosity >= VERBOSITY_JS_MIN && jsVerbosity <= VERBOSITY_JS_MAX) {
                this.parameters.jsVerbosity = jsVerbosity;
            }
        }

        if (params.has('tag') && params.has('tagverbosity')) {
            let tag = params
                .get('tag')
                .replace('[', '')
                .replace(']', '')
                .split(',');
            let tagVerbosity = params
                .get('tagverbosity')
                .replace('[', '')
                .replace(']', '')
                .split(',');
            if (tag && tagVerbosity && tag.length === tagVerbosity.length) {
                this.parameters.tag = tag;
                this.parameters.tagVerbosity = tagVerbosity;
            }
        }

        if (params.has('readonly')) {
            const readOnly = parseInt(params.get('readonly'), 10);
            if (readOnly === 0 || readOnly === 1) {
                this.parameters.readOnly = readOnly === 1;
            }
        }

        if (params.has('fastupdating')) {
            const fastUpdating = parseInt(params.get('fastupdating'), 10);
            if (fastUpdating === 0 || fastUpdating === 1) {
                this.parameters.fastUpdating = fastUpdating === 1;
            }
        }
    };

    send = request => {
        console.log('send', request);
        return this.client.send(request);
    };

    sendTdParameters = async () => {
        const apiId = process.env.REACT_APP_TELEGRAM_API_ID;
        const apiHash = process.env.REACT_APP_TELEGRAM_API_HASH;

        if (!apiId || !apiHash) {
            if (
                window.confirm(
                    'API id is missing!\nIn order to obtain an API id and develop your own application using the Telegram API please visit https://core.telegram.org/api/obtaining_api_id'
                )
            ) {
                window.location.href = 'https://core.telegram.org/api/obtaining_api_id';
            }
        }

        const { useTestDC } = this.parameters;
        const { version } = packageJson;

        this.send({
            '@type': 'setTdlibParameters',
            parameters: {
                '@type': 'tdParameters',
                use_test_dc: useTestDC,
                api_id: apiId,
                api_hash: apiHash,
                system_language_code: 'en',
                device_model: 'Web',
                system_version: 'Unknown',
                application_version: version,
                use_secret_chats: false,
                use_message_database: true,
                use_file_database: false,
                database_directory: '/db',
                files_directory: '/'
            }
            // ,
            // extra: {
            //     a: ['a', 'b'],
            //     b: 123
            // }
        });

        if (this.parameters.tag && this.parameters.tagVerbosity) {
            for (let i = 0; i < this.parameters.tag.length; i++) {
                let tag = this.parameters.tag[i];
                let tagVerbosity = this.parameters.tagVerbosity[i];

                this.send({
                    '@type': 'setLogTagVerbosityLevel',
                    tag: tag,
                    new_verbosity_level: tagVerbosity
                });
            }
        }
    };

    logOut() {
        this.send({ '@type': 'logOut' }).catch(error => {
            this.emit('tdlib_auth_error', error);
        });
    }

    setChatId = (chatId, messageId = null) => {
        const update = {
            '@type': 'clientUpdateChatId',
            chatId: chatId,
            messageId: messageId
        };

        this.clientUpdate(update);
    };
}

const controller = new TdLibController();

export default controller;

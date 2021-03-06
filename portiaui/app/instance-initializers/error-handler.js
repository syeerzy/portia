import Ember from 'ember';
import DS from 'ember-data';

function logErrorStack(e, level) {
    let text = e.toString();
    let stack = e.stack;
    if (stack) {
        if (!stack.startsWith(text)) {
            stack = `${text}\n${stack}`;
        }
        text = stack;
    }
    if (!level){
        Ember.Logger.warn(text);
    } else {
        level(text);
    }
}

export function initialize(applicationInstance) {
    const notificationManager = applicationInstance.lookup('service:notification-manager');
    var loggedErrors = new Set();

    function notifyError(err) {
        let logged = false;
        if (window.NREUM) {
            window.NREUM.noticeError(err);
            logged = true;
        }
        if (window.Raven) {
            window.Raven.captureException(err);
            logged = true;
        }

        const instructions = logged ?
            "我们的开发人员已经收到通知." :
            "请通知开发人员。详细信息已经登录到控制台.";
        let isDeleted = err => (
            err.message &&
            (/event `(didSetProperty|deleteRecord)`.*in state root\./.test(err.message) ||
             /calling set on destroyed object/.test(err.message))
        );

        if (err instanceof DS.AdapterError) {
            for (let error of err.errors) {
                if (error.id && loggedErrors.has(error.id)) {
                    continue;
                }
                Ember.Logger.warn(`AdapterError: ${error.title}\n${error.detail}`);
                notificationManager.add({
                    title: error.title || 'Server error',
                    message: 'An error occurred while communicating with the server. ' +
                        error.status >= 500 ? instructions : error.detail,
                    type: +error.status >= 500 ? 'danger' : 'warning'
                });
                if (error.id) {
                    loggedErrors.add(error.id);
                }
            }
        } else if (isDeleted(err)) {
            // Skip errors when operating on deleted
            Ember.Logger.debug(`Model Error: ${err.message}`);
            logErrorStack(err, Ember.Logger.debug);
        } else if (err.fileName === 'websocket-browser-load') {
            logErrorStack(err, Ember.Logger.debug);
        } else {
            logErrorStack(err);
            notificationManager.add({
                title: err.title || '糟糕,出现意外',
                    message: '发生了的未意料的错误~. ' + instructions,
                type: 'danger'
            });
        }
    }

    Ember.onerror = notifyError;
}

export default {
    name: 'error-handler',
    initialize: initialize
};

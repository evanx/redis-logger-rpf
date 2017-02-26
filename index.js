
const clc = require('cli-color');
const lodash = require('lodash');
const getSetDefault = require('get-set-default');

const mapping = {
    debug: clc.green,
    some: clc.cyan,
    info: clc.blue,
    warn: clc.yellow,
    error: clc.red
};

const console_log = (level, ...args) => {
    const object = args.find(arg => typeof arg === 'object');
    if (object) {
        console.error(mapping[level](JSON.stringify(args, null, 2)));
    } else {
        console.error(mapping[level](args.join(' ')));
    }
}

const that = {
    timestamp: 0,
    count: 0,
    messageTypes: {}
};

module.exports = (config, redis) => {
    const log = (level, args) => {
        that.count++;
        if (level === 'debug') {
            if (config.loggerLevel === 'debug') {
                console_log(level, ...args);
            }
        } else if (level === 'some') {
            const timeLimit = (config.loggerLevel === 'debug') ? 2000 : 30000;
            if (typeof args[0] === 'string') {
                const messageString = args[0];
                const messageType = getSetDefault(that.messageTypes, messageString, {timestamp: 0, count: 0});
                messageType.count++;
                if (Date.now() - messageType.timestamp > timeLimit) {
                    console_log(level, messageType.count, ...args);
                    messageType.timestamp = Date.now();
                } 
            } else if (Date.now() - that.timestamp > timeLimit) {
                console_log(level, that.count, ...args);
                that.timestamp = Date.now();
            }
        } else {
            console_log(level, ...args);
        }
    };
    return ['debug', 'some', 'info', 'warn', 'error']
    .reduce((logger, level) => {
        logger[level] = (...args) => log(level, args);
        return logger;
    }, {
    });
};


const clc = require('cli-color');
const lodash = require('lodash');
const getSetDefault = require('get-set-default');

const mapping = {
    debug: clc.xterm(251),
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
};

module.exports = (config, redis) => {
    const timeLimit = (config.loggerLevel === 'debug') ? 60000 : 600000;
    const log = (level, args) => {
        const name = (typeof args[0] === 'string') ? args[0] : level;
        const data = getSetDefault(that, name, {timestamp: 0, count: 0});
        data.count++;
        if (Date.now() - data.timestamp > timeLimit) {
            console_log(level, data.count, ...args);
            data.timestamp = Date.now();
        } 
    };
    return ['debug', 'some', 'info', 'warn', 'error']
    .reduce((logger, level) => {
        logger[level] = (...args) => log(level, args);
        return logger;
    }, {
    });
};

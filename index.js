
const clc = require('cli-color');
const lodash = require('lodash');

module.exports = (config, redis) => [
    'debug', 'info', 'warn', 'error'
].reduce((logger, level) => {
    logger[level] = function() {
        if (level === 'debug') {
            if (config.loggerLevel === 'debug') {
                console_log(level, ...arguments);
            }
        } else {
            console_log(level, ...arguments);
        }
    };
    return logger;
}, {});

const mapping = {
    debug: clc.green,
    info: clc.blue,
    warn: clc.yellow,
    error: clc.red
};

function console_log(level, ...args) {
    const object = args.find(arg => typeof arg === 'object');
    if (object) {
        console.error(mapping[level](JSON.stringify(args, null, 2)));
    } else {
        console.error(mapping[level](args.join(' ')));
    }
}

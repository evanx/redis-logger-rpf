
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

const getName = (level, arg) => {
    if (typeof arg === 'string') { 
        return arg;
    }
    if (typeof arg === 'object') { 
        if (arg.name) {
            return arg.name;
        }
        const keys = Object.keys(arg);
        if (keys.length === 1) {
            return keys[0];
        }
    }
    return level;
}

const that = {};

module.exports = (config, redis) => {
    const client = redis.createClient({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword
    });
    const timeLimit = (config.loggerLevel === 'debug') ? 60000 : 600000;
    const log = (level, args) => {
        const arg = args[0];  
        const name = getName(arg);
        const data = getSetDefault(that, name, {timestamp: 0, count: 0});
        data.count++;
        if (Date.now() - data.timestamp > timeLimit) {
            if (typeof arg === 'object' && arg.name === 'DataError' && arg.data) {
                const jsonKey = `logger:error:${config.redisNamespace}:j`;
                client.set(jsonKey, JSON.stringify(arg.data), (err, result) => {
                    if (err) {
                        console.error(module.filename, 'set', jsonKey, err.message);
                    }
                });
            }
            console_log(level, data.count, ...args);
            data.timestamp = Date.now();
        }
    };
    return ['debug', 'some', 'info', 'warn', 'error']
    .reduce((logger, level) => {
        logger[level] = (...args) => log(level, args);
        return logger;
    }, {
       end: () => {
           client.end(true);
       }
    });
};

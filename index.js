
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

const console_log = (level, data, args) => {
    const object = args.find(arg => typeof arg === 'object');
    if (object) {
        if (level === 'error' && object.message) {
            console.error(mapping[level](object.message));
        } else {
            console.error(mapping[level](JSON.stringify(args, null, 2)));
        }
    } else {
        console.error(mapping[level](args.join(' ')));
    }
}

const getName = arg => {
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
    return null;
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
        const name = getName(arg) || level;
        const data = getSetDefault(that, name, {timestamp: 0, count: 0});
        const timestamp = Date.now();
        data.count++;
        if (timestamp - data.timestamp > timeLimit) {
            if (typeof arg === 'object' && arg.name === 'DataError' && arg.message && arg.data) {
                const jsonKey = `logger:error:${config.redisNamespace}:j`;
                const hashesKey = `logger:error:${config.redisNamespace}:h`;
                const multi = client.multi();
                multi.set(jsonKey, JSON.stringify(arg.data));
                multi.hset(hashesKey, 'time', new Date(timestamp).toISOString());
                multi.hset(hashesKey, 'message', arg.message);
                multi.exec((err, results) => {
                    if (err) {
                        console.error(module.filename, 'set', jsonKey, err.message);
                    }
                });
            }
            data.timestamp = timestamp;
            console_log(level, data, args);
        } else if (process.env.NODE_ENV === 'development') {
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

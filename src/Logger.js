const chalk = require('chalk');
const figures = require('figures');

const USE_ANSI = process.env.RUN_ENV !== 'inspect';
const PACKAGE = '[image-sprite]';

function cyan(str) {
    if (USE_ANSI) {
        return chalk.cyan.bold(str);
    }
    return str;
}
function green(str) {
    if (USE_ANSI) {
        return chalk.green.bold(str);
    }
    return str;
}
function yellow(str) {
    if (USE_ANSI) {
        return chalk.yellow.bold(str);
    }
    return str;
}
function red(str) {
    if (USE_ANSI) {
        return chalk.red.bold(str);
    }
    return str;
}
function white(str) {
    if (USE_ANSI) {
        return chalk.white(str);
    }
    return str;
}

const prefixError = red(PACKAGE + ' ' + figures.cross);
const prefixLog = green(PACKAGE);
const prefixOk = green(PACKAGE + ' ' + figures.tick);
const prefixWarn = yellow(PACKAGE + ' ' + figures.warning);

class Logger {

    constructor(useLog = true) {
        this._useLog = useLog;
    }

    desc(...args) {
        if (this._useLog) {
            console.log(...args);
        }
    }

    emp(...args) {
        return cyan(args.join(' '));
    }

    error(...args) {
        if (this._useLog) {
            console.warn(prefixError, red(args.join(' ')));
        }
    }

    log(...args) {
        if (this._useLog) {
            console.log(prefixLog, ...args);
        }
    }

    nl() {
        if (this._useLog) {
            console.log('');
        }
    }

    ok(...args) {
        if (this._useLog) {
            console.log(prefixOk, ...args);
        }
    }

    transformOk(from, to) {
        this.ok(white(from), green('→'), white(to));
    }

    use(useLog) {
        this._useLog = useLog;
    }

    warn(...args) {
        if (this._useLog) {
            console.warn(prefixWarn, yellow(args.join(' ')));
        }
    }
}

module.exports = Logger;

import chalk from 'chalk';
import figures from 'figures';

const USE_ANSI = process.env.RUN_ENV !== 'inspect';
const PACKAGE = '[image-sprite]';

function cyan(str: string): string {
    if (USE_ANSI) {
        return chalk.cyan.bold(str);
    }
    return str;
}

function green(str: string): string {
    if (USE_ANSI) {
        return chalk.green.bold(str);
    }
    return str;
}

function yellow(str: string): string {
    if (USE_ANSI) {
        return chalk.yellow.bold(str);
    }
    return str;
}

function red(str: string): string {
    if (USE_ANSI) {
        return chalk.red.bold(str);
    }
    return str;
}

function white(str: string): string {
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
    private _useLog: boolean;

    constructor(useLog = true) {
        this._useLog = useLog;
    }

    desc(...args: unknown[]): void {
        if (this._useLog) {
            console.log(...args);
        }
    }

    emp(...args: unknown[]): string {
        return cyan(args.map(String).join(' '));
    }

    error(...args: unknown[]): void {
        if (this._useLog) {
            console.warn(prefixError, red(args.map(String).join(' ')));
        }
    }

    log(...args: unknown[]): void {
        if (this._useLog) {
            console.log(prefixLog, ...args);
        }
    }

    nl(): void {
        if (this._useLog) {
            console.log('');
        }
    }

    ok(...args: unknown[]): void {
        if (this._useLog) {
            console.log(prefixOk, ...args);
        }
    }

    transformOk(from: string, to: string): void {
        this.ok(white(from), green('→'), white(to));
    }

    use(useLog: boolean): void {
        this._useLog = useLog;
    }

    warn(...args: unknown[]): void {
        if (this._useLog) {
            console.warn(prefixWarn, yellow(args.map(String).join(' ')));
        }
    }
}

export default Logger;

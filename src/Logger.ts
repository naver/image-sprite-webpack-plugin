/* eslint-disable no-console */
export class Logger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getChildLogger(arg0: string | (() => string)) {
    return new Logger();
  }

  error(...args: any[]): void {
    console.error(...args);
  }

  warn(...args: any[]): void {
    console.warn(...args);
  }

  info(...args: any[]): void {
    console.info(...args);
  }

  log(...args: any[]): void {
    console.log(...args);
  }

  debug(...args: any[]): void {
    console.debug(...args);
  }

  assert(assertion: any, ...args: any[]): void {
    console.assert(assertion, ...args);
  }

  trace(): void {
    console.trace();
  }

  clear(): void {
    console.clear();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  status(...args: any[]): void {
    //
  }

  group(...args: any[]): void {
    console.group(...args);
  }

  groupCollapsed(...args: any[]): void {
    console.groupCollapsed(...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groupEnd(...args: any[]): void {
    console.groupEnd();
  }

  profile(label?: any): void {
    console.profile(label);
  }

  profileEnd(label?: any): void {
    console.profileEnd(...label);
  }

  time(label?: any): void {
    console.time(label);
  }

  timeLog(label?: any): void {
    console.timeLog(label);
  }

  timeEnd(label?: any): void {
    console.timeEnd(label);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timeAggregate(label?: any): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timeAggregateEnd(label?: any): void {
    //
  }
}

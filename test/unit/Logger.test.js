const Logger = require('../../dist/Logger').default

describe('Logger', () => {
  let originalConsoleLog
  let originalConsoleWarn
  let logOutput
  let warnOutput

  beforeEach(() => {
    logOutput = []
    warnOutput = []
    originalConsoleLog = console.log
    originalConsoleWarn = console.warn
    console.log = (...args) => logOutput.push(args)
    console.warn = (...args) => warnOutput.push(args)
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
  })

  describe('constructor', () => {
    test('should enable logging by default', () => {
      const logger = new Logger()
      expect(logger._useLog).toBe(true)
    })

    test('should accept useLog parameter', () => {
      const logger = new Logger(false)
      expect(logger._useLog).toBe(false)
    })
  })

  describe('use', () => {
    test('should enable/disable logging', () => {
      const logger = new Logger()
      logger.use(false)
      expect(logger._useLog).toBe(false)
      logger.use(true)
      expect(logger._useLog).toBe(true)
    })
  })

  describe('log', () => {
    test('should output when logging is enabled', () => {
      const logger = new Logger(true)
      logger.log('test message')
      expect(logOutput.length).toBe(1)
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.log('test message')
      expect(logOutput.length).toBe(0)
    })
  })

  describe('warn', () => {
    test('should output when logging is enabled', () => {
      const logger = new Logger(true)
      logger.warn('warning message')
      expect(warnOutput.length).toBe(1)
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.warn('warning message')
      expect(warnOutput.length).toBe(0)
    })
  })

  describe('error', () => {
    test('should output when logging is enabled', () => {
      const logger = new Logger(true)
      logger.error('error message')
      expect(warnOutput.length).toBe(1)
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.error('error message')
      expect(warnOutput.length).toBe(0)
    })
  })

  describe('ok', () => {
    test('should output when logging is enabled', () => {
      const logger = new Logger(true)
      logger.ok('success message')
      expect(logOutput.length).toBe(1)
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.ok('success message')
      expect(logOutput.length).toBe(0)
    })
  })

  describe('nl', () => {
    test('should output newline when logging is enabled', () => {
      const logger = new Logger(true)
      logger.nl()
      expect(logOutput.length).toBe(1)
      expect(logOutput[0]).toEqual([''])
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.nl()
      expect(logOutput.length).toBe(0)
    })
  })

  describe('desc', () => {
    test('should output when logging is enabled', () => {
      const logger = new Logger(true)
      logger.desc('description')
      expect(logOutput.length).toBe(1)
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.desc('description')
      expect(logOutput.length).toBe(0)
    })
  })

  describe('emp', () => {
    test('should return formatted string', () => {
      const logger = new Logger()
      const result = logger.emp('test', 'message')
      expect(typeof result).toBe('string')
    })
  })

  describe('transformOk', () => {
    test('should output transformation message when logging is enabled', () => {
      const logger = new Logger(true)
      logger.transformOk('from', 'to')
      expect(logOutput.length).toBe(1)
    })

    test('should not output when logging is disabled', () => {
      const logger = new Logger(false)
      logger.transformOk('from', 'to')
      expect(logOutput.length).toBe(0)
    })
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

type LoggerModule = typeof import("~/lib/logger")
type WinstonModule = typeof import("winston")
type LoggerConfig = import("~/lib/logger").LoggerConfig

vi.mock("~/lib/logger", async () => {
  const actual = await vi.importActual<LoggerModule>("~/lib/logger")
  return actual
})

type WinstonMocks = {
  shouldThrow: boolean
  createLogger: ReturnType<typeof vi.fn>
  log: ReturnType<typeof vi.fn>
  consoleTransport: ReturnType<typeof vi.fn>
  formatCombine: ReturnType<typeof vi.fn>
  formatTimestamp: ReturnType<typeof vi.fn>
  formatErrors: ReturnType<typeof vi.fn>
  formatPrintf: ReturnType<typeof vi.fn>
}

const winstonMocks = vi.hoisted((): WinstonMocks => ({
  shouldThrow: false,
  createLogger: vi.fn(),
  log: vi.fn(),
  consoleTransport: vi.fn(),
  formatCombine: vi.fn(),
  formatTimestamp: vi.fn(),
  formatErrors: vi.fn(),
  formatPrintf: vi.fn()
}))

const buildWinstonFactory = (): WinstonModule => {
  if (winstonMocks.shouldThrow) {
    throw new Error("winston import failed")
  }

  class ConsoleTransportMock {
    public options: unknown

    constructor(options: unknown) {
      this.options = options
      winstonMocks.consoleTransport(options)
    }
  }

  const module = {
    createLogger: (config: unknown) => {
      winstonMocks.createLogger(config)

      return {
        log: (...args: unknown[]) => {
          winstonMocks.log(...(args as [string, string, Record<string, unknown>]))
        }
      } as ReturnType<WinstonModule["createLogger"]>
    },
    transports: {
      Console: ConsoleTransportMock
    },
    format: {
      combine: (...args: unknown[]) => winstonMocks.formatCombine(...args),
      timestamp: (options: unknown) => winstonMocks.formatTimestamp(options),
      errors: (options: unknown) => winstonMocks.formatErrors(options),
      printf: (formatter: unknown) => winstonMocks.formatPrintf(formatter)
    }
  }

  return module as unknown as WinstonModule
}

describe("lib/logger", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let originalLogLevel: string | undefined

  const loadLoggerModule = async () => {
    const module = await import("~/lib/logger") as LoggerModule
    module.__testHooks.reset()
    module.__testHooks.setWinstonFactory(buildWinstonFactory)
    module.__testHooks.init({ force: true })
    return module
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    originalLogLevel = process.env.LOG_LEVEL

    winstonMocks.shouldThrow = false
    winstonMocks.createLogger = vi.fn()
    winstonMocks.log = vi.fn()
    winstonMocks.consoleTransport = vi.fn()
    winstonMocks.formatCombine = vi.fn((...args: unknown[]) => ({
      type: "combine",
      args
    }))
    winstonMocks.formatTimestamp = vi.fn((options: unknown) => ({
      type: "timestamp",
      options
    }))
    winstonMocks.formatErrors = vi.fn((options: unknown) => ({
      type: "errors",
      options
    }))
    winstonMocks.formatPrintf = vi.fn((formatter: unknown) => ({
      type: "printf",
      formatter
    }))

    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL
    } else {
      process.env.LOG_LEVEL = originalLogLevel
    }

    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it("initialises winston with expected configuration", async () => {
    process.env.LOG_LEVEL = "debug"

    const loggerModule = await loadLoggerModule()

    expect(winstonMocks.createLogger).toHaveBeenCalledTimes(1)
    const config = winstonMocks.createLogger.mock.calls[0]?.[0] as LoggerConfig
    expect(config).toBeDefined()

    expect(config!.level).toBe("debug")
    expect(config!.defaultMeta).toEqual({ service: "linxz" })
    expect(config!.levels).toMatchObject({
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7
    })

    expect(winstonMocks.consoleTransport).toHaveBeenCalledTimes(1)
    const transportOptions = winstonMocks.consoleTransport.mock.calls[0][0] as Record<string, unknown>

    const timestampResult = winstonMocks.formatTimestamp.mock.results[0]?.value
    const errorsResult = winstonMocks.formatErrors.mock.results[0]?.value
    const printfResult = winstonMocks.formatPrintf.mock.results[0]?.value

    expect(winstonMocks.formatTimestamp).toHaveBeenCalledWith({ format: "YYYY-MM-DD HH:mm:ss" })
    expect(winstonMocks.formatErrors).toHaveBeenCalledWith({ stack: false })
    expect(typeof winstonMocks.formatPrintf.mock.calls[0]?.[0]).toBe("function")
    expect(winstonMocks.formatCombine).toHaveBeenCalledWith(timestampResult, errorsResult, printfResult)

    expect(transportOptions?.['format']).toBe(winstonMocks.formatCombine.mock.results[0]?.value)
    expect(loggerModule.__testHooks.getLastConfig()).toEqual(config)
  })

  it("returns per-channel singletons and forwards metadata", async () => {
    const loggerModule = await loadLoggerModule()

    const first = loggerModule.createLogger("api")
    const second = loggerModule.createLogger("api")
    const third = loggerModule.createLogger("auth")

    expect(first).toBe(second)
    expect(third).not.toBe(first)

    first.info("user created", { userId: 42 })
    second.error("login failed", { reason: "invalid" })

    expect(winstonMocks.log).toHaveBeenCalledTimes(2)
    expect(winstonMocks.log.mock.calls[0]).toEqual([
      "info",
      "user created",
      expect.objectContaining({ channel: "api", userId: 42 })
    ])
    expect(winstonMocks.log.mock.calls[1][0]).toBe("error")
    expect(winstonMocks.log.mock.calls[1][1]).toBe("login failed")
    expect(winstonMocks.log.mock.calls[1][2]).toEqual(expect.objectContaining({
      channel: "api",
      reason: "invalid"
    }))
  })

  it("falls back to console logging when winston throws", async () => {
    winstonMocks.shouldThrow = true

    const loggerModule = await loadLoggerModule()
    const fallbackLogger = loggerModule.createLogger("client")

    fallbackLogger.info("ping", { traceId: "abc" })

    expect(consoleWarnSpy).toHaveBeenCalledWith("Winston logger not available on client-side")
    expect(consoleLogSpy).toHaveBeenCalledWith("[client] INFO: ping", { traceId: "abc" })
    expect(winstonMocks.log).not.toHaveBeenCalled()
    expect(winstonMocks.createLogger).not.toHaveBeenCalled()
  })

  it("logs all syslog levels correctly", async () => {
    const loggerModule = await loadLoggerModule()
    const testLogger = loggerModule.createLogger("test")

    testLogger.emerg("system down", { cpu: 100 })
    testLogger.alert("database full", { usage: "99%" })
    testLogger.crit("memory leak", { heap: "2GB" })
    testLogger.warning("slow query", { duration: "5s" })
    testLogger.notice("user login", { userId: 123 })
    testLogger.debug("debug info", { temp: "data" })

    expect(winstonMocks.log).toHaveBeenCalledTimes(6)
    
    expect(winstonMocks.log.mock.calls[0]).toEqual([
      "emerg",
      "system down",
      expect.objectContaining({ channel: "test", cpu: 100 })
    ])
    expect(winstonMocks.log.mock.calls[1]).toEqual([
      "alert", 
      "database full",
      expect.objectContaining({ channel: "test", usage: "99%" })
    ])
    expect(winstonMocks.log.mock.calls[2]).toEqual([
      "crit",
      "memory leak", 
      expect.objectContaining({ channel: "test", heap: "2GB" })
    ])
    expect(winstonMocks.log.mock.calls[3]).toEqual([
      "warning",
      "slow query",
      expect.objectContaining({ channel: "test", duration: "5s" })
    ])
    expect(winstonMocks.log.mock.calls[4]).toEqual([
      "notice",
      "user login",
      expect.objectContaining({ channel: "test", userId: 123 })
    ])
    expect(winstonMocks.log.mock.calls[5]).toEqual([
      "debug",
      "debug info", 
      expect.objectContaining({ channel: "test", temp: "data" })
    ])
  })

  it("falls back to console logging for all levels when winston throws", async () => {
    winstonMocks.shouldThrow = true

    const loggerModule = await loadLoggerModule()
    const fallbackLogger = loggerModule.createLogger("fallback")

    fallbackLogger.emerg("emergency", { critical: true })
    fallbackLogger.alert("alert", { urgent: true })
    fallbackLogger.crit("critical", { severity: "high" })
    fallbackLogger.warning("warning", { level: "medium" })
    fallbackLogger.notice("notice", { info: "normal" })
    fallbackLogger.debug("debug", { verbose: true })

    // Winston warning is only shown once during initialization
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith("Winston logger not available on client-side")
    
    expect(consoleLogSpy).toHaveBeenCalledWith("[fallback] EMERG: emergency", { critical: true })
    expect(consoleLogSpy).toHaveBeenCalledWith("[fallback] ALERT: alert", { urgent: true })
    expect(consoleLogSpy).toHaveBeenCalledWith("[fallback] CRIT: critical", { severity: "high" })
    expect(consoleLogSpy).toHaveBeenCalledWith("[fallback] WARNING: warning", { level: "medium" })
    expect(consoleLogSpy).toHaveBeenCalledWith("[fallback] NOTICE: notice", { info: "normal" })
    expect(consoleLogSpy).toHaveBeenCalledWith("[fallback] DEBUG: debug", { verbose: true })
  })

  it("handles logging without context parameter", async () => {
    const loggerModule = await loadLoggerModule()
    const testLogger = loggerModule.createLogger("simple")

    testLogger.info("simple message")
    testLogger.error("error without context")
    testLogger.debug("debug message")

    expect(winstonMocks.log).toHaveBeenCalledTimes(3)
    expect(winstonMocks.log.mock.calls[0]).toEqual([
      "info",
      "simple message",
      expect.objectContaining({ channel: "simple" })
    ])
    expect(winstonMocks.log.mock.calls[1]).toEqual([
      "error", 
      "error without context",
      expect.objectContaining({ channel: "simple" })
    ])
    expect(winstonMocks.log.mock.calls[2]).toEqual([
      "debug",
      "debug message",
      expect.objectContaining({ channel: "simple" })
    ])
  })

  it("includes caller information in log metadata", async () => {
    const loggerModule = await loadLoggerModule()
    const testLogger = loggerModule.createLogger("caller-test")

    testLogger.info("test with caller info", { customData: "value" })

    expect(winstonMocks.log).toHaveBeenCalledTimes(1)
    const logCall = winstonMocks.log.mock.calls[0]
    
    expect(logCall[0]).toBe("info")
    expect(logCall[1]).toBe("test with caller info")
    expect(logCall[2]).toEqual(expect.objectContaining({
      channel: "caller-test",
      file: expect.any(String),
      line: expect.any(Number),
      customData: "value"
    }))
    
    // Verify file is not "unknown" and line is a positive number
    const metadata = logCall[2] as Record<string, unknown>
    expect(metadata.file).not.toBe("unknown")
    expect(metadata.line).toBeGreaterThan(0)
  })

  it("handles different log levels with caller information", async () => {
    const loggerModule = await loadLoggerModule()
    const testLogger = loggerModule.createLogger("multi-level")

    testLogger.emerg("emergency", { critical: true })
    testLogger.warning("warning", { level: "medium" })
    testLogger.debug("debug", { verbose: true })

    expect(winstonMocks.log).toHaveBeenCalledTimes(3)
    
    // Check that all calls include file and line information
    for (let i = 0; i < 3; i++) {
      const metadata = winstonMocks.log.mock.calls[i][2] as Record<string, unknown>
      expect(metadata).toHaveProperty("file")
      expect(metadata).toHaveProperty("line")
      expect(metadata.file).not.toBe("unknown")
      expect(metadata.line).toBeGreaterThan(0)
    }
  })

  it("handles test hooks reset and initialization", async () => {
    const loggerModule = await loadLoggerModule()
    
    // Create a logger to populate cache
    const logger1 = loggerModule.createLogger("cache-test")
    logger1.info("test message")
    
    expect(winstonMocks.log).toHaveBeenCalledTimes(1)
    
    // Reset and reinitialize
    loggerModule.__testHooks.reset()
    loggerModule.__testHooks.setWinstonFactory(buildWinstonFactory)
    loggerModule.__testHooks.init({ force: true })
    
    // Create new logger after reset
    const logger2 = loggerModule.createLogger("cache-test-2")
    logger2.error("after reset")
    
    expect(winstonMocks.log).toHaveBeenCalledTimes(2)
    expect(winstonMocks.createLogger).toHaveBeenCalledTimes(2)
  })

  it("handles test hooks without force option", async () => {
    const loggerModule = await loadLoggerModule()
    
    // Test init without force
    loggerModule.__testHooks.init()
    
    const testLogger = loggerModule.createLogger("no-force")
    testLogger.info("no force test")
    
    expect(winstonMocks.log).toHaveBeenCalledTimes(1)
  })

  it("handles test hooks with null factory", async () => {
    const loggerModule = await loadLoggerModule()
    
    // Set factory to null and reset to force reinitialization
    // @ts-expect-error - Testing null factory behavior
    loggerModule.__testHooks.setWinstonFactory(null)
    loggerModule.__testHooks.init({ force: true })
    
    const testLogger = loggerModule.createLogger("null-factory")
    testLogger.info("null factory test")
    
    // With null factory, it should use native winston (not our mock)
    // The native winston doesn't call our mocks, but the logger should still work
    expect(winstonMocks.log).toHaveBeenCalledTimes(0)
    // We can verify the logger was created successfully by checking it exists
    expect(testLogger).toBeDefined()
    expect(typeof testLogger.info).toBe("function")
  })

  it("handles empty context object", async () => {
    const loggerModule = await loadLoggerModule()
    const testLogger = loggerModule.createLogger("empty-context")

    testLogger.info("message with empty context", {})
    testLogger.error("message with null context", null as any)

    expect(winstonMocks.log).toHaveBeenCalledTimes(2)
    
    const firstCall = winstonMocks.log.mock.calls[0]
    expect(firstCall[2]).toEqual(expect.objectContaining({
      channel: "empty-context"
    }))
    
    const secondCall = winstonMocks.log.mock.calls[1]
    expect(secondCall[2]).toEqual(expect.objectContaining({
      channel: "empty-context"
    }))
  })
})

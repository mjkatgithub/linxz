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
    const config = winstonMocks.createLogger.mock.calls[0][0] as LoggerConfig

    expect(config.level).toBe("debug")
    expect(config.defaultMeta).toEqual({ service: "linxz" })
    expect(config.levels).toMatchObject({
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
})

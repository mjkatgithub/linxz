// Nur auf Server-Side verwenden
// eslint-disable-next-line @typescript-eslint/no-explicit-any, import/no-mutable-exports
let logger: any = null

type WinstonModule = typeof import('winston')
type LoggerConfig = Parameters<WinstonModule['createLogger']>[0]

const channelLoggerCache = new Map<string, ChannelLogger>()
let forceInitialization = false
let customWinstonFactory: (() => WinstonModule) | null = null
let lastLoggerConfig: LoggerConfig | null = null

// Server-Side Logger initialisieren
function initLogger() {
  const isNodeRuntime = typeof process !== 'undefined' && process.release?.name === 'node'
  if ((import.meta.server || isNodeRuntime || forceInitialization) && !logger) {
    try {
      const winston = customWinstonFactory ? customWinstonFactory() : loadNativeWinston()
      // Syslog Log Levels (RFC 3164)
      const syslogLevels = {
        emerg: 0,   // System is unusable
        alert: 1,   // Action must be taken immediately
        crit: 2,    // Critical conditions
        error: 3,   // Error conditions
        warning: 4, // Warning conditions
        notice: 5,  // Normal but significant condition
        info: 6,    // Informational messages
        debug: 7    // Debug-level messages
      }

      const config: LoggerConfig = {
        levels: syslogLevels,
        level: process.env.LOG_LEVEL || 'info',
        defaultMeta: { service: 'linxz' },
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
              }),
              winston.format.errors({ stack: false }),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const firstLine = `${timestamp} ${level}: ${message}`
                const { stack, ...contextData } = meta as Record<string, unknown>
                const secondLine = JSON.stringify(contextData, null, 2)

                return `${firstLine}\n${secondLine}`
              })
            )
          })
        ]
      }

      logger = winston.createLogger(config)
      lastLoggerConfig = config
    } catch {
      console.warn('Winston logger not available on client-side')
    } finally {
      forceInitialization = false
    }
  } else {
    forceInitialization = false
  }
}

initLogger()

function loadNativeWinston(): WinstonModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('winston') as WinstonModule
}

function getCallerInfo(): { file: string; line: number } {
  const stack = new Error().stack
  if (!stack) return { file: 'unknown', line: 0 }

  const lines = stack.split('\n')
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line && !line.includes('lib/logger.ts') && !line.includes('node_modules')) {
      const match = line.match(/\((.+):(\d+):\d+\)|at (.+):(\d+):\d+/)
      if (match) {
        const filePath = match[1] || match[3]
        const lineNumber = parseInt(match[2] || match[4])
        if (filePath) {
          const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
          return { file: fileName, line: lineNumber }
        }
      }
    }
  }

  return { file: 'unknown', line: 0 }
}

class ChannelLogger {
  private channel: string

  constructor(channel: string) {
    this.channel = channel
  }

  private log(level: string, message: string, context?: Record<string, unknown>) {
    if (!logger) {
      console.log(`[${this.channel}] ${level.toUpperCase()}: ${message}`, context)
      return
    }

    const callerInfo = getCallerInfo()
    const meta: Record<string, unknown> = {
      channel: this.channel,
      file: callerInfo.file,
      line: callerInfo.line,
      ...context
    }

    logger.log(level, message, meta)
  }

  emerg(message: string, context?: Record<string, unknown>) {
    this.log('emerg', message, context)
  }

  alert(message: string, context?: Record<string, unknown>) {
    this.log('alert', message, context)
  }

  crit(message: string, context?: Record<string, unknown>) {
    this.log('crit', message, context)
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context)
  }

  warning(message: string, context?: Record<string, unknown>) {
    this.log('warning', message, context)
  }

  notice(message: string, context?: Record<string, unknown>) {
    this.log('notice', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }
}

export const createLogger = (channel: string) => {
  if (!channelLoggerCache.has(channel)) {
    channelLoggerCache.set(channel, new ChannelLogger(channel))
  }

  return channelLoggerCache.get(channel) as ChannelLogger
}

export const __testHooks = {
  reset() {
    channelLoggerCache.clear()
    logger = null
    lastLoggerConfig = null
  },
  init(options?: { force?: boolean }) {
    if (options?.force) {
      forceInitialization = true
    }
    initLogger()
  },
  setWinstonFactory(factory?: () => WinstonModule) {
    customWinstonFactory = factory ?? null
    logger = null
  },
  getLastConfig() {
    return lastLoggerConfig
  }
}

export default logger

export type { WinstonModule, LoggerConfig }

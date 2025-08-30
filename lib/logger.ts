import winston from 'winston'
import path from 'path'

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

// Logger-Konfiguration
const logger = winston.createLogger({
  levels: syslogLevels,
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'linxz' },
  transports: [
    // Console Transport mit Pretty Print
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.prettyPrint({
          colorize: true,
          depth: 4
        })
      )
    })
  ]
})

// Automatische Datei-Erkennung (ähnlich wie Monolog Processors)
function getCallerInfo(): { file: string; line: number } {
  const stack = new Error().stack
  if (!stack) return { file: 'unknown', line: 0 }
  
  const lines = stack.split('\n')
  // Suche nach der ersten Zeile, die nicht aus dem Logger kommt
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line && !line.includes('lib/logger.ts') && !line.includes('node_modules')) {
      const match = line.match(/\((.+):(\d+):\d+\)|at (.+):(\d+):\d+/)
      if (match) {
        const filePath = match[1] || match[3]
        const lineNumber = parseInt(match[2] || match[4])
        if (filePath) {
          // Extrahiere nur den Dateinamen
          const fileName = path.basename(filePath)
          return { file: fileName, line: lineNumber }
        }
      }
    }
  }
  
  return { file: 'unknown', line: 0 }
}

// Channel-spezifische Logger-Klasse
class ChannelLogger {
  private channel: string

  constructor(channel: string) {
    this.channel = channel
  }

  private log(level: string, message: string, context?: Record<string, unknown>) {
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

// Logger-Factory für Channel-spezifische Logger
export const createLogger = (channel: string) => {
  return new ChannelLogger(channel)
}



export default logger

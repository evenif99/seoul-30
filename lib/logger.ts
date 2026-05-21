type LogLevel = 'info' | 'warn' | 'error'
type LogEvent = Record<string, unknown>

function log(level: LogLevel, event: LogEvent): void {
  const line = JSON.stringify({ level, ts: new Date().toISOString(), ...event })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export const logger = {
  info:  (event: LogEvent) => log('info',  event),
  warn:  (event: LogEvent) => log('warn',  event),
  error: (event: LogEvent) => log('error', event),
}

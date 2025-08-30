type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = this.formatMessage(level, message, data);

    if (this.isDevelopment) {
      switch (level) {
        case 'info':
          console.log(`ℹ️ ${message}`, data || '');
          break;
        case 'warn':
          console.warn(`⚠️ ${message}`, data || '');
          break;
        case 'error':
          console.error(`❌ ${message}`, data || '');
          break;
        case 'debug':
          console.debug(`🐛 ${message}`, data || '');
          break;
      }
    }

    // In production, you might want to send logs to a logging service
    if (!this.isDevelopment) {
      // Implement production logging here
    }
  }

  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }

  public debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger();

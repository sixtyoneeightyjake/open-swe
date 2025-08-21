/* eslint-disable no-console */
import { getConfig } from "@langchain/langgraph";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// ANSI escape codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

// Define a list of colors (foreground)
const COLORS = [
  "\x1b[31m", // Red
  "\x1b[32m", // Green
  "\x1b[33m", // Yellow
  "\x1b[34m", // Blue
  "\x1b[35m", // Magenta
  "\x1b[36m", // Cyan
  "\x1b[91m", // Bright Red
  "\x1b[92m", // Bright Green
  "\x1b[93m", // Bright Yellow
  "\x1b[94m", // Bright Blue
  "\x1b[95m", // Bright Magenta
  "\x1b[96m", // Bright Cyan
];

// Simple hashing function to get a positive integer
function simpleHash(str: string): number {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash); // Ensure positive for modulo index
}

// Helper function to safely extract thread_id and run_id from LangGraph config
function getThreadAndRunIds(): { thread_id?: string; run_id?: string } {
  try {
    const config = getConfig();
    return {
      thread_id: config.configurable?.thread_id,
      run_id: config.configurable?.run_id,
    };
  } catch {
    // If getConfig throws an error or config.configurable is undefined,
    // return empty object and proceed as normal
    return {};
  }
}

function logWithOptionalIds(styledPrefix: string, message: string, data?: any) {
  const ids = getThreadAndRunIds();
  if (Object.keys(ids).length > 0) {
    const logData = data !== undefined ? { ...data, ...ids } : ids;
    console.log(`${styledPrefix} ${message}`, logData);
  } else {
    if (data !== undefined) {
      console.log(`${styledPrefix} ${message}`, data);
    } else {
      console.log(`${styledPrefix} ${message}`);
    }
  }
}

// Helper function to determine if a log should be output based on level hierarchy
function shouldLog(messageLevel: LogLevel, configuredLevel: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const messageIndex = levels.indexOf(messageLevel);
  const configuredIndex = levels.indexOf(configuredLevel);
  
  // In production, only allow warn and error logs
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && (messageLevel === LogLevel.DEBUG || messageLevel === LogLevel.INFO)) {
    return false;
  }
  
  return messageIndex >= configuredIndex;
}

export function createLogger(level: LogLevel, prefix: string) {
  const colorIndex = simpleHash(prefix) % COLORS.length;
  const color = COLORS[colorIndex];
  const styledPrefix = `${color}${BOLD}[${prefix}]${RESET}`;
  const isProduction = process.env.NODE_ENV === 'production';

  const logStructured = (logLevel: LogLevel, message: string, data?: any) => {
    if (isProduction) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: logLevel,
        service: 'open-swe-backend',
        prefix,
        message,
        ...getThreadAndRunIds(),
        ...(data && { data })
      };
      console.log(JSON.stringify(logEntry));
    } else {
      logWithOptionalIds(styledPrefix, message, data);
    }
  };

  return {
    debug: (message: string, data?: any) => {
      if (shouldLog(LogLevel.DEBUG, level)) {
        logStructured(LogLevel.DEBUG, message, data);
      }
    },
    info: (message: string, data?: any) => {
      if (shouldLog(LogLevel.INFO, level)) {
        logStructured(LogLevel.INFO, message, data);
      }
    },
    warn: (message: string, data?: any) => {
      if (shouldLog(LogLevel.WARN, level)) {
        logStructured(LogLevel.WARN, message, data);
      }
    },
    error: (message: string, data?: any) => {
      if (shouldLog(LogLevel.ERROR, level)) {
        logStructured(LogLevel.ERROR, message, data);
      }
    },
  };
}

// Request logging middleware for Hono
export function requestLogger() {
  return async (c: any, next: any) => {
    const start = Date.now();
    const method = c.req.method;
    const url = c.req.url;
    
    await next();
    
    const duration = Date.now() - start;
    const status = c.res.status;
    
    const logger = createLogger(LogLevel.INFO, 'HTTP');
    logger.info(`${method} ${url}`, {
      status,
      duration: `${duration}ms`,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP')
    });
  };
}

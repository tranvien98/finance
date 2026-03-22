type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function logError(
  message: string,
  error: unknown,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level: 'error',
    message,
    timestamp: new Date().toISOString(),
    context,
    metadata,
  };

  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  console.error(formatLog(entry));
}

export function logApiError(
  endpoint: string,
  statusCode: number,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  logError(
    `API error: ${endpoint} returned ${statusCode}`,
    error,
    endpoint,
    { statusCode, ...metadata }
  );
}

export function logInfo(
  message: string,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    context,
    metadata,
  };

  console.log(formatLog(entry));
}

export function logWarn(
  message: string,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level: 'warn',
    message,
    timestamp: new Date().toISOString(),
    context,
    metadata,
  };

  console.warn(formatLog(entry));
}

type LogContext = Record<string, unknown>;

export function logServerError(source: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      ...context,
      error: error instanceof Error ? error.message : String(error),
      source,
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
}

type LogMeta = Record<string, unknown>;

function formatLog(level: string, message: string, meta?: LogMeta) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(formatLog("info", message, meta));
  },

  error(message: string, meta?: LogMeta) {
    console.error(formatLog("error", message, meta));
  },
};

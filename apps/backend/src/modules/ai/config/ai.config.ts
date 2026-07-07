export const AI_CONFIG = {
  AI_TIMEOUT_MS: 30000,
  MAX_TOOL_CALLS: 5,
  MAX_HISTORY: 10,
  DEFAULT_MODEL: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  TEMPERATURE: parseFloat(process.env.CLAUDE_TEMPERATURE || '0'),
  MAX_TOKENS: parseInt(process.env.CLAUDE_MAX_TOKENS || '2000', 10),
};

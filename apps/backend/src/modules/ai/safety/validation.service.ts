import { SAFETY_CONSTANTS } from './validation.constants.js';
import { ValidationResult } from './validation.types.js';

export class ValidationService {
  validatePrompt(prompt: string): ValidationResult {
    if (prompt.length > SAFETY_CONSTANTS.MAX_PROMPT_LENGTH) {
      return { valid: false, error: 'Oversized Prompt' };
    }
    return { valid: true };
  }

  validateTool(toolName: string, allowedTools: string[]): ValidationResult {
    if (!allowedTools.includes(toolName)) {
      return { valid: false, error: 'Unknown Tool: ' + toolName };
    }
    return { valid: true };
  }
}

export const validationService = new ValidationService();

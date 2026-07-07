import { ToolDefinition } from './tool.types.js';

export class ToolRegistry {
  private registry: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.registry.set(tool.name, tool);
  }

  async execute(name: string, args: any): Promise<any> {
    const tool = this.registry.get(name);
    if (!tool) {
      throw new Error('Unknown Tool: ' + name);
    }
    return tool.handler(args);
  }

  listTools(): string[] {
    return Array.from(this.registry.keys());
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.registry.get(name);
  }
}

export const toolRegistry = new ToolRegistry();

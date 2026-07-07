export interface ToolDefinition {
  name: string;
  description: string;
  handler: (args: any) => Promise<any>;
}

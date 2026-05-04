import { Ollama, Message } from 'ollama';
import { tools, toolSchemas } from './tools';

export class Agent {
  private ollama: Ollama;
  private model: string;
  private messages: Message[] = [];

  // Custom system prompt that sets the persona
  private systemPrompt = `You are an expert AI software engineer, inspired by Claude Code and OpenDevin.
Your goal is to assist the user with coding and design tasks.
You have access to a set of tools to read/write files and execute bash commands.
Use these tools to explore the workspace, execute commands, test code, and fulfill the user's requests autonomously.
Always explain what you are going to do before calling a tool.`;

  constructor(model: string = 'llama3', host: string = 'http://localhost:11434') {
    this.ollama = new Ollama({ host });
    this.model = model;

    // Initialize with system prompt
    this.messages.push({
      role: 'system',
      content: this.systemPrompt
    });
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public async chat(userMessage: string, onUpdate?: (chunk: string) => void): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });

    while (true) {
      const response = await this.ollama.chat({
        model: this.model,
        messages: this.messages,
        tools: toolSchemas,
        stream: false, // For tool-calling loops, standard non-streaming is usually simpler, but we can stream the text later if we want.
      });

      const message = response.message;
      this.messages.push(message);

      // In this non-streaming approach, we won't emit the content via onUpdate
      // unless it's just to show intermediate status, because the CLI prints the final response.

      if (message.tool_calls && message.tool_calls.length > 0) {
        if (onUpdate) {
            onUpdate(`\n[Executing ${message.tool_calls.length} tool(s)...]\n`);
        }
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name as keyof typeof tools;
          const args = toolCall.function.arguments as any;

          if (onUpdate) {
            onUpdate(`- ${functionName}(${JSON.stringify(args)})\n`);
          }

          let toolResult = '';
          if (functionName in tools) {
            toolResult = await tools[functionName](args);
          } else {
            toolResult = `Error: Tool ${functionName} not found.`;
          }

          this.messages.push({
            role: 'tool',
            content: toolResult,
          });
        }
        // Let the model continue responding with the tool results
        continue;
      }

      // No more tool calls, exit loop
      return message.content || '';
    }
  }
}

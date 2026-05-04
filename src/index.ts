import readline from 'readline';
import chalk from 'chalk';
import { Agent } from './agent';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Welcome to Ruflo Local Agent (Powered by Ollama)'));
  console.log(chalk.gray('Type your request below. Type "exit" or "quit" to stop.\n'));

  // Allow custom model to be passed via args or environment variable
  const model = process.argv[2] || process.env.OLLAMA_MODEL || 'llama3';
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';

  console.log(chalk.yellow(`Connecting to Ollama model: ${model} at ${host}`));

  const agent = new Agent(model, host);

  while (true) {
    const input = await askQuestion(chalk.green.bold('\n❯ '));

    if (!input.trim()) continue;

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log(chalk.cyan('\nGoodbye! 👋'));
      rl.close();
      break;
    }

    try {
      process.stdout.write(chalk.blue('🤖 Agent is thinking... '));
      const response = await agent.chat(input, (update) => {
          // Clear "thinking" line if it's there
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(chalk.gray(update));
      });

      // If we streamed or updated via tool calls, just make sure we end cleanly
      // Let's only print the final response if we didn't print it via onUpdate
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      console.log(chalk.cyan(`🤖 Agent:\n`) + response);
    } catch (error: any) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      console.error(chalk.red.bold(`\n❌ Error: ${error.message}`));
      if (error.message.includes('fetch failed')) {
         console.error(chalk.yellow(`Make sure your local Ollama instance is running at ${host}`));
      }
    }
  }
}

main().catch(console.error);

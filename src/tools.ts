import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

import { Tool } from 'ollama';

export const toolSchemas: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Reads the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'The path of the file to read',
          },
        },
        required: ['filepath'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Writes content to a file, creating directories if needed',
      parameters: {
        type: 'object',
        properties: {
          filepath: {
            type: 'string',
            description: 'The path of the file to write to',
          },
          content: {
            type: 'string',
            description: 'The content to write to the file',
          },
        },
        required: ['filepath', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_bash',
      description: 'Executes a bash command and returns the stdout and stderr',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The bash command to run',
          },
        },
        required: ['command'],
      },
    },
  },
];

export const tools = {
  read_file: async (args: { filepath: string }) => {
    try {
      const content = await fs.readFile(args.filepath, 'utf-8');
      return content;
    } catch (err: any) {
      return `Error reading file: ${err.message}`;
    }
  },

  write_file: async (args: { filepath: string; content: string }) => {
    try {
      const dirname = path.dirname(args.filepath);
      await fs.mkdir(dirname, { recursive: true });
      await fs.writeFile(args.filepath, args.content, 'utf-8');
      return `File ${args.filepath} written successfully.`;
    } catch (err: any) {
      return `Error writing file: ${err.message}`;
    }
  },

  run_bash: async (args: { command: string }) => {
    try {
      const { stdout, stderr } = await execAsync(args.command);
      let result = '';
      if (stdout) result += `STDOUT:\n${stdout}\n`;
      if (stderr) result += `STDERR:\n${stderr}\n`;
      if (!result) result = 'Command executed successfully with no output.';
      return result;
    } catch (err: any) {
      return `Error executing command:\nSTDOUT: ${err.stdout || ''}\nSTDERR: ${err.stderr || err.message}`;
    }
  },
};

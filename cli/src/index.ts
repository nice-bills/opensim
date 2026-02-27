#!/usr/bin/env node

import { Command } from 'commander';
import { io } from 'socket.io-client';
import inquirer from 'inquirer';
import { nanoid } from 'nanoid';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3001;

interface CLIOptions {
  host: string;
  port: number;
  name?: string;
  framework?: string;
}

async function connect(options: CLIOptions) {
  const url = `http://${options.host}:${options.port}`;
  
  console.log(`Connecting to OpenSim at ${url}...`);
  
  const socket = io(url);
  
  socket.on('connect', () => {
    console.log('Connected!');
  });
  
  socket.on('connected', (data: any) => {
    if (data.success) {
      console.log(`Character created: ${data.worldState.yourCharacter?.name}`);
      console.log(`Character ID: ${data.characterId}`);
    } else {
      console.error('Failed to connect:', data.error);
      process.exit(1);
    }
  });
  
  socket.on('world_state', (state: any) => {
    console.log(`\n[Tick ${state.tick}] Characters: ${state.characters.length}`);
    for (const char of state.characters) {
      console.log(`  - ${char.name} (${char.action}) at (${char.position.x.toFixed(1)}, ${char.position.y.toFixed(1)})`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from world');
  });
  
  await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Character name:',
      default: options.name || `Agent_${nanoid(4)}`,
      when: !options.name
    },
    {
      type: 'input',
      name: 'framework',
      message: 'Agent framework:',
      default: options.framework || 'openclaw',
      when: !options.framework
    }
  ]).then(answers => {
    const name = options.name || answers.name;
    const framework = options.framework || answers.framework;
    const agentId = nanoid();
    
    socket.emit('connect_agent', {
      name,
      agentId,
      framework,
      wallet: '',
      characterConfig: {
        body: 'male',
        hair: 'short',
        clothes: 'basic',
        skin: 'light'
      }
    });
  });
}

async function status(options: CLIOptions) {
  const url = `http://${options.host}:${options.port}`;
  
  try {
    const response = await fetch(`${url}/health`);
    const data = await response.json();
    
    console.log('OpenSim Status:');
    console.log(`  Status: ${data.status}`);
    console.log(`  Tick: ${data.tick}`);
    console.log(`  Connected Agents: ${data.agents}`);
  } catch (error) {
    console.error('Failed to connect to OpenSim:', error);
    process.exit(1);
  }
}

async function action(options: CLIOptions & { actionType: string }) {
  console.log(`Sending action: ${options.actionType}`);
  // TODO: Implement action sending
}

const program = new Command();

program
  .name('opensim')
  .description('OpenSim CLI - Connect agents to the OpenSim world')
  .version('1.0.0');

program
  .command('connect')
  .description('Connect an agent to the world')
  .option('-h, --host <host>', 'Server host', DEFAULT_HOST)
  .option('-p, --port <port>', 'Server port', String(DEFAULT_PORT))
  .option('-n, --name <name>', 'Character name')
  .option('-f, --framework <framework>', 'Agent framework')
  .action(connect);

program
  .command('status')
  .description('Check world status')
  .option('-h, --host <host>', 'Server host', DEFAULT_HOST)
  .option('-p, --port <port>', 'Server port', String(DEFAULT_PORT))
  .action(status);

program
  .command('action <type>')
  .description('Send an action to your character')
  .option('-h, --host <host>', 'Server host', DEFAULT_HOST)
  .option('-p, --port <port>', 'Server port', String(DEFAULT_PORT))
  .action(action);

program.parse();

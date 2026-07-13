#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { generateHeuristicCommit } from './generator/heuristic.js';
import { runInteractiveGenerate } from './generator/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as {
  version: string;
};

const program = new Command();
const git = simpleGit();

program
  .name('clg')
  .description('Generate and lint commit messages')
  .version(pkg.version);

program
  .command('generate')
  .description('Generate a commit message from staged changes')
  .argument('[CommitMsgFile]', 'Commit message file path (Automatically filled by git hook)')
  // TODO: add option for --heuristic (dan default ke AI) after
  // generator/ai.ts implemented. For now all request
  // using heuristic generator.
  .action(async () => {
    try {
      const result = await generateHeuristicCommit(git);

      const commitMessage = result.scope
        ? `${result.type}(${result.scope}): ${result.description}`
        : `${result.type}: ${result.description}`;

      console.log('\nGenerated commit message:');
      console.log(`  ${commitMessage}`);
      console.log(`\nConfidence: ${result.confidence}`);
    } catch (error) {
      console.error('Error generating commit message:', error);
      process.exit(1);
    }
  });

program.parse();
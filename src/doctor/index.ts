import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import OpenAI from 'openai';
import type { Config } from '../config/defaultConfig.js';

function pass(label: string, detail?: string) {
    console.log(chalk.green('  ✓') + ' ' + label + (detail ? chalk.dim('  ' + detail) : ''));
}

function fail(label: string, detail?: string) {
    console.log(chalk.red('  ✗') + ' ' + label + (detail ? chalk.dim('  ' + detail) : ''));
}

function warn(label: string, detail?: string) {
    console.log(chalk.yellow('  !') + ' ' + label + (detail ? chalk.dim('  ' + detail) : ''));
}

function section(title: string) {
    console.log('\n' + chalk.bold(title));
}

export async function runDoctor(config: Config): Promise<void> {
    console.log(chalk.bold.cyan('clg doctor') + ' — checking your environment\n');

    section('Git');
    try {
        const version = execSync('git --version', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        pass('Git is installed', version);
    } catch {
        fail('Git is not installed or not in PATH');
    }

    section('Config');
    const linuxHome = homedir();
    const linuxConfig = join(linuxHome, '.commitlintgenrc.json');

    let winConfigPath: string | null = null;
    try {
        const winProfile = execSync('cmd.exe /c echo %USERPROFILE%', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
        if (winProfile && winProfile !== '%USERPROFILE%') {
            const winHome = execSync(`wslpath -u "${winProfile}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
                .toString()
                .trim();
            winConfigPath = join(winHome, '.commitlintgenrc.json');
        }
    } catch { }

    const localConfig = join(process.cwd(), '.commitlintgenrc.json');
    const localConfigExists = existsSync(localConfig);
    const linuxConfigExists = existsSync(linuxConfig);
    const winConfigExists = winConfigPath ? existsSync(winConfigPath) : false;

    if (localConfigExists) {
        pass('Local config found', localConfig);
    } else {
        warn('No local config', '.commitlintgenrc.json not found in project root');
    }

    if (linuxConfigExists) {
        pass('Global config found (Linux home)', linuxConfig);
    } else if (winConfigExists) {
        pass('Global config found (Windows home)', winConfigPath!);
    } else {
        warn('No global config', '~/.commitlintgenrc.json not found');
    }

    if (process.env.GROQ_API_KEY) {
        pass('GROQ_API_KEY env var is set');
    } else if (process.env.apiKey) {
        pass('apiKey env var is set (from .env)');
    } else if (config.apiKey) {
        pass('API key loaded from config file');
    } else {
        fail('No API key found', 'Set GROQ_API_KEY or add apiKey to your config');
    }

    console.log(chalk.dim(`  provider : ${config.aiProvider}`));
    console.log(chalk.dim(`  baseURL  : ${config.baseURL}`));
    console.log(chalk.dim(`  model    : ${config.model}`));

    section('API Connection');

    if (!config.apiKey) {
        fail('Skipping API test — no API key configured');
        console.log('\n' + chalk.yellow('Run `clg config` to set up your API key.'));
        return;
    }

    try {
        const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
        const start = Date.now();
        const response = await client.chat.completions.create({
            model: config.model,
            messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
            max_tokens: 10,
        });
        const elapsed = Date.now() - start;
        const reply = response.choices[0]?.message?.content?.trim() ?? '';
        if (reply) {
            pass(`API responded in ${elapsed}ms`, `model=${config.model}`);
        } else {
            fail('API returned an empty response');
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        fail('API connection failed', msg);
    }

    console.log();
}

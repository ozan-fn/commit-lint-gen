import { cosmiconfigSync } from 'cosmiconfig';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defaultConfig, type Config } from './defaultConfig.js';

loadDotenv({ debug: false });

export function loadConfig(): Config {
    const explorer = cosmiconfigSync('commitlintgen');
    const globalConfig = join(homedir(), '.commitlintgenrc.json');
    const result = explorer.search() ?? (existsSync(globalConfig) ? explorer.load(globalConfig) : null);

    const fileConfig = result?.config ?? {};

    const merged: Config = {
        ...defaultConfig,
        ...fileConfig,
        apiKey: process.env.GROQ_API_KEY ?? fileConfig.apiKey ?? defaultConfig.apiKey,
    };

    return merged;
}
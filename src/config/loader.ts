import { cosmiconfigSync } from 'cosmiconfig';
import { config as loadDotenv } from 'dotenv';
import { defaultConfig, type Config } from './defaultConfig.js';

loadDotenv();

export function loadConfig(): Config {
    const explorer = cosmiconfigSync('commitlintgen');
    const result = explorer.search();

    const fileConfig = result?.config ?? {};

    const merged: Config = {
        ...defaultConfig,
        ...fileConfig,
        apiKey: process.env.GROQ_API_KEY ?? fileConfig.apiKey ?? defaultConfig.apiKey,
    };

    return merged;
}
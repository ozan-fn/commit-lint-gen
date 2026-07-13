export interface Config {
    aiProvider: string;
    baseURL: string;
    model: string;
    apiKey?: string;

    rules?: {
        maxLength?: number;
        minLength?: number;
        types?: string[];
        scopes?: string[];
        requireScope?: boolean;
    }
}

export const defaultConfig: Config = {
    aiProvider: 'groq',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'qwen/qwen3.6-27b',
    rules: {
        maxLength: 100,
        minLength: 10,
        types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci'],
        requireScope: false
    }
}
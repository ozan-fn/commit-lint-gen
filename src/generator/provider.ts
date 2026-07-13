import OpenAI from "openai";
import type { Config } from "../config/defaultConfig.js";

export function createAIProvider(config: Config): OpenAI {
    if (!config.apiKey) {
        throw new Error("API key is required for AI generation. Please set your GROQ_API_KEY in your environment or add apiKey to your config.");
    }

    return new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL
    });
}
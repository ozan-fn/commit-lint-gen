import { describe, it, expect } from 'vitest';
import {
  parseCommitMessage,
  validateType,
  validateScope,
  validateLength,
  validateDescription,
} from '../../src/linter/rules.js';
import type { Config } from '../../src/config/defaultConfig.js';

const mockConfig: Config = {
  aiProvider: 'groq',
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'qwen/qwen3.6-27b',
  rules: {
    maxLength: 100,
    minLength: 10,
    types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci'],
    scopes: ['api', 'ui', 'cli'],
    requireScope: false,
  },
};

describe('parseCommitMessage', () => {
  it('should parse commit with scope', () => {
    const result = parseCommitMessage('feat(api): add user endpoint');
    expect(result).toEqual({
      type: 'feat',
      scope: 'api',
      description: 'add user endpoint',
      raw: 'feat(api): add user endpoint',
    });
  });

  it('should parse commit without scope', () => {
    const result = parseCommitMessage('fix: resolve bug');
    expect(result).toEqual({
      type: 'fix',
      description: 'resolve bug',
      raw: 'fix: resolve bug',
    });
  });

  it('should return null for invalid format', () => {
    expect(parseCommitMessage('invalid commit')).toBeNull();
    expect(parseCommitMessage('feat add feature')).toBeNull();
    expect(parseCommitMessage('')).toBeNull();
  });
});

describe('validateType', () => {
  it('should accept valid types', () => {
    const parsed = parseCommitMessage('feat: add feature')!;
    expect(validateType(parsed, mockConfig)).toBeNull();
  });

  it('should reject invalid types', () => {
    const parsed = parseCommitMessage('invalid: something')!;
    const error = validateType(parsed, mockConfig);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('type');
  });

  it('should allow any type when rules.types is empty', () => {
    const config = { ...mockConfig, rules: { ...mockConfig.rules, types: [] } };
    const parsed = parseCommitMessage('custom: something')!;
    expect(validateType(parsed, config)).toBeNull();
  });
});

describe('validateScope', () => {
  it('should allow missing scope when not required', () => {
    const parsed = parseCommitMessage('feat: add feature')!;
    expect(validateScope(parsed, mockConfig)).toBeNull();
  });

  it('should reject missing scope when required', () => {
    const config = { ...mockConfig, rules: { ...mockConfig.rules, requireScope: true } };
    const parsed = parseCommitMessage('feat: add feature')!;
    const error = validateScope(parsed, config);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('scope');
  });

  it('should accept valid scope', () => {
    const parsed = parseCommitMessage('feat(api): add endpoint')!;
    expect(validateScope(parsed, mockConfig)).toBeNull();
  });

  it('should reject invalid scope', () => {
    const parsed = parseCommitMessage('feat(invalid): add something')!;
    const error = validateScope(parsed, mockConfig);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('scope');
  });
});

describe('validateLength', () => {
  it('should accept valid length', () => {
    const parsed = parseCommitMessage('feat: add feature')!;
    expect(validateLength(parsed, mockConfig)).toBeNull();
  });

  it('should reject too long message', () => {
    const longMessage = 'feat: ' + 'a'.repeat(100);
    const parsed = parseCommitMessage(longMessage)!;
    const error = validateLength(parsed, mockConfig);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('max-length');
  });

  it('should reject too short message', () => {
    const parsed = parseCommitMessage('feat: ab')!;
    const error = validateLength(parsed, mockConfig);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('min-length');
  });
});

describe('validateDescription', () => {
  it('should accept valid description', () => {
    const parsed = parseCommitMessage('feat: add feature')!;
    expect(validateDescription(parsed)).toBeNull();
  });

  it('should reject uppercase start', () => {
    const parsed = parseCommitMessage('feat: Add feature')!;
    const error = validateDescription(parsed);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('description-case');
  });

  it('should reject period at end', () => {
    const parsed = parseCommitMessage('feat: add feature.')!;
    const error = validateDescription(parsed);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('description-period');
  });

  it('should reject empty description', () => {
    const parsed = { type: 'feat', description: '', raw: 'feat: ' };
    const error = validateDescription(parsed);
    expect(error).toBeTruthy();
    expect(error?.rule).toBe('description');
  });
});

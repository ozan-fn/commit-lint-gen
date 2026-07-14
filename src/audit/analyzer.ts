import type { SimpleGit } from 'simple-git';
import { validateCommitMessage } from '../linter/validate.js';
import type { ValidationError } from '../linter/rules.js';
import type { Config } from '../config/defaultConfig.js';

export interface CommitAnalysis {
    hash: string;
    message: string;
    author: string;
    date: string;
    isValid: boolean;
    errors: ValidationError[];
}

export async function analyzeCommitHistory(git: SimpleGit, config: Config, limit: number = 20): Promise<CommitAnalysis[]> {
    const log = await git.log({ maxCount: limit });

    const analyses: CommitAnalysis[] = [];

    for (const commit of log.all) {
        const validation = validateCommitMessage(commit.message, config);

        analyses.push({
            hash: commit.hash.substring(0, 7),
            message: commit.message,
            author: commit.author_name,
            date: commit.date,
            isValid: validation.valid,
            errors: validation.errors,
        });
    }

    return analyses;
}

export function formatAnalysisReport(analyses: CommitAnalysis[]): string {
    const invalidCommits = analyses.filter(a => !a.isValid);
    const validCommits = analyses.filter(a => a.isValid);

    let report = `\nCommit History Analysis\n`;
    report += `   Total commits analyzed: ${analyses.length}\n`;
    report += `   Valid: ${validCommits.length}\n`;
    report += `   Invalid: ${invalidCommits.length}\n\n`;

    if (invalidCommits.length === 0) {
        report += `All commits follow conventional commit format!\n`;
        return report;
    }

    report += `Non-conventional commits:\n\n`;

    for (const commit of invalidCommits) {
        report += `  ${commit.hash} - ${commit.author}\n`;
        report += `  Message: "${commit.message}"\n`;
        report += `  Issues:\n`;

        for (const error of commit.errors) {
            report += `    • ${error.message}\n`;
        }

        report += `\n`;
    }

    return report;
}

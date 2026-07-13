import { writeFileSync } from 'node:fs';
import type { SimpleGit } from 'simple-git';
import { generateHeuristicCommit } from './heuristic.js';
import { promptCommitAction, editDraft, manualEntry } from './interactive.js';
import type { Config } from '../config/defaultConfig.js';

function formatMessage(type: string, scope: string | undefined, description: string): string {
    return scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;
}

/**
 * Main loop: generate draft -> preview -> wait user action -> repeat
 * until user press accept (write into commitMsgFile) or cancel (exit non-zero).
 *
 * commitMsgFile is filled if called by git hook prepare-commit-msg
 * (git gives file path through first argument). If called manually
 * through `clg generate` without hook, commitMsgFile undefined -> end result
 * only printed to stdout, not written to any file.
 */
export async function runInteractiveGenerate(git: SimpleGit, config: Config, commitMsgFile?: string): Promise<void> {
    const initial = await generateHeuristicCommit(git);
    let draft = formatMessage(initial.type, initial.scope, initial.description);
    let confidence: string | undefined = initial.confidence;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const action = await promptCommitAction(draft, confidence);

        if (action === 'accept') {
            if (commitMsgFile) {
                writeFileSync(commitMsgFile, draft + '\n');
            } else {
                console.log(draft);
            }
            return;
        }

        if (action === 'edit') {
            const edited = await editDraft(draft);
            if (edited !== null) {
                draft = edited;
                confidence = undefined;
            }
            continue;
        }

        if (action === 'regenerate') {
            const result = await generateHeuristicCommit(git);
            draft = formatMessage(result.type, result.scope, result.description);
            confidence = result.confidence;
            continue;
        }

        if (action === 'manual') {
            const manual = await manualEntry();
            if (manual !== null) {
                draft = manual;
                confidence = undefined;
            }
            continue;
        }

        if (action === 'cancel') {
            console.log('Cancelled, did not continue commit.');
            process.exit(1);
        }
    }
}
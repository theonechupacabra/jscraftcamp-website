import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { getLocation, parse, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { loadParticipantJsonFilePaths, parseParticipantJson } from './participants';
import { PARTICIPANTS_DIRECTORY } from './participant-schema';

const JSONC_PARSE_OPTIONS = { allowTrailingComma: true } as const;

function formatParseErrors(text: string, errors: ParseError[]): string {
	return errors
		.map((error) => {
			const location = getLocation(text, error.offset);
			const path = location.path.length > 0 ? location.path.join('.') : 'root';
			return `${path}: ${printParseErrorCode(error.error)}`;
		})
		.join(', ');
}

async function assertValidParticipantJson(filePath: string) {
	const text = await readFile(filePath, 'utf-8');
	const parseErrors: ParseError[] = [];
	parse(text, parseErrors, JSONC_PARSE_OPTIONS);

	if (parseErrors.length > 0) {
		throw new Error(`JSON syntax error in '${filePath}': ${formatParseErrors(text, parseErrors)}`);
	}

	return parseParticipantJson(filePath);
}

describe('Participants', async () => {
	const folderContent = await readdir(PARTICIPANTS_DIRECTORY, {
		withFileTypes: true,
		encoding: 'utf8'
	});

	describe('directory structure', () => {
		it('contains only regular json files', () => {
			const nonJsonFiles = folderContent.filter(
				(dirent) => !dirent.isFile() || !dirent.name.endsWith('json')
			);

			expect(nonJsonFiles.length).toBe(0);
		});

		it('contains only _template.json starting with a _', () => {
			const underscoreFiles = folderContent.flatMap((dirent) => {
				if (!dirent.name.startsWith('_')) {
					return [];
				}

				return dirent.name;
			});

			expect(underscoreFiles).toEqual(['_template.json']);
		});
	});

	const participantJsonPaths = await loadParticipantJsonFilePaths(PARTICIPANTS_DIRECTORY);

	for (const participantFile of participantJsonPaths) {
		describe('parseParticipants', async () => {
			it(`should parse '${participantFile}' without syntax or validation error`, async () => {
				let error: string | null = null;
				try {
					await assertValidParticipantJson(participantFile);
				} catch (err) {
					error = (err as Error).message;
					console.error(error);
				}

				expect(error).toBeNull();
			});
		});
	}

	describe('githubAccountName', async () => {
		const participantsByFile = await Promise.all(
			participantJsonPaths.map(async (file) => ({
				file,
				githubAccountName: (await parseParticipantJson(file)).githubAccountName
			}))
		);

		it('must not be "jscraftcamp" (the placeholder from _template.json)', () => {
			const offenders = participantsByFile.filter((p) => p.githubAccountName === 'jscraftcamp');

			expect(offenders).toEqual([]);
		});

		it('must be unique across all participants', () => {
			const firstSeenBy = new Map<string, string>();
			const duplicates: { githubAccountName: string; files: string[] }[] = [];

			for (const { file, githubAccountName } of participantsByFile) {
				if (!githubAccountName) continue;
				const previousFile = firstSeenBy.get(githubAccountName);
				if (previousFile) {
					duplicates.push({ githubAccountName, files: [previousFile, file] });
				} else {
					firstSeenBy.set(githubAccountName, file);
				}
			}

			expect(duplicates).toEqual([]);
		});
	});
});

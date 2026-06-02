import { readdir, readFile } from 'node:fs/promises';
import {
	ParticipantSchema,
	type Participant,
	PARTICIPANTS_DIRECTORY
} from '$lib/participants/participant-schema';
import {
	getLocation,
	parse,
	printParseErrorCode,
	type ParseError
} from 'jsonc-parser';
import { join } from 'node:path';

const JSONC_PARSE_OPTIONS = { allowTrailingComma: true } as const;

function formatParseErrors(text: string, errors: ParseError[]): string {
	return errors
		.map((error) => {
			const location = getLocation(text, error.offset);
			const path = location.path.length > 0 ? location.path.join('.') : 'root';
			return `\t${path}: ${printParseErrorCode(error.error)}`;
		})
		.join('\n');
}

export async function loadParticipantJsonFilePaths(directory: string): Promise<string[]> {
	const participantsDirectory = await readdir(directory, {
		withFileTypes: true,
		encoding: 'utf8'
	});

	const participantsFilePaths = participantsDirectory
		.filter(
			(dirent) => dirent.isFile() && dirent.name.endsWith('.json') && !dirent.name.startsWith('_')
		)
		.map(({ name }) => join(PARTICIPANTS_DIRECTORY, name));

	return participantsFilePaths;
}

export async function loadAllParticipants(): Promise<Participant[]> {
	const paths = await loadParticipantJsonFilePaths(PARTICIPANTS_DIRECTORY);
	return loadParticipants(paths);
}

/**
 * parses all participants JSONs according to ParticipantSchema
 * and ignores all files which fail the validation
 */
export async function loadParticipants(filePaths: string[]): Promise<Participant[]> {
	const participantResults = await Promise.allSettled(filePaths.map(parseParticipantJson));

	const participants: Participant[] = participantResults.flatMap((r) => {
		if (r.status === 'rejected') {
			console.error(`Skipping ${r.reason.message}`);
			return [];
		}
		return r.value;
	});

	return participants;
}

export async function parseParticipantJson(filePath: string): Promise<Participant> {
	const text = await readFile(filePath, 'utf-8');
	const parseErrors: ParseError[] = [];
	const json = parse(text, parseErrors, JSONC_PARSE_OPTIONS) as unknown;

	if (parseErrors.length > 0) {
		throw Error(`Invalid participant json '${filePath}':\n${formatParseErrors(text, parseErrors)}`);
	}

	const result = ParticipantSchema.safeParse(json);

	if (!result.success) {
		const errorMessages = result.error.errors
			.map((m) => {
				const pathPrefix = m.path.length > 0 ? `'${m.path.join(',')}': ` : '';
				return `\t${pathPrefix}${m.message}`;
			})
			.join('\n');
		throw Error(`Invalid participant json '${filePath}':\n${errorMessages}`);
	}

	return result.data;
}

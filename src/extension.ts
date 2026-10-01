import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Types – mirrors the RASA domain YAML structure for responses
// ---------------------------------------------------------------------------

/** A single response variation in RASA (the items under an utter key). */
interface RasaResponseVariation {
	text?: string;
	image?: string;
	custom?: unknown;
	buttons?: Array<{ title: string; payload: string }>;
	[key: string]: unknown;
}

/** The top-level `responses` mapping in a RASA domain file. */
interface RasaDomain {
	responses?: Record<string, RasaResponseVariation[]>;
}

/** A match result that pairs response variations with their source location. */
interface UtterMatch {
	uri: vscode.Uri;
	line: number;               // 0-based line where the utter key appears
	variations: RasaResponseVariation[];
}

// ---------------------------------------------------------------------------
// Hover Provider
// ---------------------------------------------------------------------------

class RasaUtterHoverProvider implements vscode.HoverProvider {

	/**
	 * Regex that matches an `utter_*` identifier.
	 * It accepts word characters plus hyphens (common in RASA action names).
	 */
	private static readonly UTTER_REGEX = /utter_[\w-]+/;

	async provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): Promise<vscode.Hover | undefined> {

		// 1. Detect the utter_* token under the cursor
		const range = document.getWordRangeAtPosition(position, RasaUtterHoverProvider.UTTER_REGEX);
		if (!range) {
			return undefined;
		}

		const utterName = document.getText(range);

		// 2. Search for the response text in the workspace YAML files
		const matches = await this.findUtterResponses(utterName);

		if (matches.length === 0) {
			return undefined;
		}

		// 3. Build the hover content
		const md = this.buildMarkdown(utterName, matches);

		return new vscode.Hover(md, range);
	}

	// -----------------------------------------------------------------------
	// YAML search & parsing
	// -----------------------------------------------------------------------

	/**
	 * Searches all `domain/**​/*.yml` and `domain.yml` files in every workspace
	 * folder for the given utter name and returns the matching response
	 * variations together with their source file URI and line number.
	 */
	private async findUtterResponses(utterName: string): Promise<UtterMatch[]> {

		// Glob patterns that cover the most common RASA project layouts:
		//   - domain.yml          (single-file domain)
		//   - domain/**​/*.yml     (split domain)
		//   - domain/**​/*.yaml    (yaml extension variant)
		const patterns = [
			'**/domain/**/*.{yml,yaml}',
			'**/domain.{yml,yaml}',
		];

		const uris: vscode.Uri[] = [];

		for (const pattern of patterns) {
			const found = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
			uris.push(...found);
		}

		// De-duplicate by URI string (findFiles may overlap)
		const seen = new Set<string>();
		const uniqueUris = uris.filter(u => {
			const key = u.toString();
			if (seen.has(key)) { return false; }
			seen.add(key);
			return true;
		});

		const matches: UtterMatch[] = [];

		for (const uri of uniqueUris) {
			try {
				const raw = await vscode.workspace.fs.readFile(uri);
				const text = Buffer.from(raw).toString('utf-8');
				const parsed = yaml.load(text) as RasaDomain | undefined;

				if (parsed?.responses?.[utterName]) {
					// Find the line number where `utterName:` appears
					const line = this.findLineOfKey(text, utterName);
					matches.push({
						uri,
						line,
						variations: parsed.responses[utterName],
					});
				}
			} catch {
				// Silently skip files that fail to parse
			}
		}

		return matches;
	}

	/**
	 * Scans raw YAML text to find the 0-based line number where a key like
	 * `  utter_greet:` is defined (with optional leading whitespace).
	 * Falls back to 0 if not found.
	 */
	private findLineOfKey(text: string, key: string): number {
		const lines = text.split('\n');
		// Match lines like "  utter_greet:" with optional trailing spaces/comments
		const keyPattern = new RegExp(`^\\s*${this.escapeRegex(key)}\\s*:`);
		for (let i = 0; i < lines.length; i++) {
			if (keyPattern.test(lines[i])) {
				return i;
			}
		}
		return 0;
	}

	/** Escapes special regex characters in a string. */
	private escapeRegex(s: string): string {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// -----------------------------------------------------------------------
	// Markdown rendering
	// -----------------------------------------------------------------------

	private buildMarkdown(
		utterName: string,
		matches: UtterMatch[],
	): vscode.MarkdownString {

		const md = new vscode.MarkdownString();
		md.isTrusted = true;
		md.supportHtml = true;

		md.appendMarkdown(`**🤖 ${utterName}**\n\n`);

		for (const match of matches) {
			// Build a command URI that invokes our custom go-to command
			const args = encodeURIComponent(JSON.stringify([
				match.uri.toString(),
				match.line,
			]));

			const fileName = match.uri.path.split('/').pop() ?? match.uri.fsPath;
			const linkUri = `command:rasa-utter-hover.goToDefinition?${args}`;			

			match.variations.forEach((v, idx) => {
				if (match.variations.length > 1) {
					md.appendMarkdown(`---\n**Variation ${idx + 1}**\n\n`);
				}

				if (v.text) {
					md.appendMarkdown(`💬 ${v.text}\n\n`);
				}

				if (v.image) {
					md.appendMarkdown(`🖼️ Image: \`${v.image}\`\n\n`);
				}

				if (v.buttons && v.buttons.length > 0) {
					md.appendMarkdown('🔘 Buttons:\n');
					for (const btn of v.buttons) {
						md.appendMarkdown(`  - **${btn.title}** → \`${btn.payload}\`\n`);
					}
					md.appendMarkdown('\n');
				}

				// Show any custom payload as JSON
				if (v.custom) {
					md.appendMarkdown('⚙️ Custom payload:\n');
					md.appendCodeblock(JSON.stringify(v.custom, null, 2), 'json');
				}
			});
			md.appendMarkdown(`📄 [${fileName}:${match.line + 1}](${linkUri} "Go to definition")\n\n`);
		}

		return md;
	}
}

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "rasa-utter-hover" is now active.');

	// --- Custom command to navigate to a file + line -----------------------
	const goToCmd = vscode.commands.registerCommand(
		'rasa-utter-hover.goToDefinition',
		async (uriString: string, line: number) => {
			const uri = vscode.Uri.parse(uriString);
			const doc = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(doc);

			const pos = new vscode.Position(line, 0);
			editor.selection = new vscode.Selection(pos, pos);
			editor.revealRange(
				new vscode.Range(pos, pos),
				vscode.TextEditorRevealType.InCenter,
			);
		},
	);

	// --- Hover provider ----------------------------------------------------
	const selector: vscode.DocumentSelector = [
		{ scheme: 'file', language: 'python' },
		{ scheme: 'file', language: 'yaml' },
		{ scheme: 'file', language: 'markdown' },
		{ scheme: 'file', language: 'plaintext' },
	];

	const hoverProvider = vscode.languages.registerHoverProvider(
		selector,
		new RasaUtterHoverProvider(),
	);

	context.subscriptions.push(goToCmd, hoverProvider);
}

export function deactivate() {}

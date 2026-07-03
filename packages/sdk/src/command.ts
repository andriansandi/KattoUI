/** A command that can be invoked from the command palette or shortcuts. */
export interface CommandItem {
	id: string;
	label: string;
	shortLabel?: string;
	icon?: string;
	keywords?: string[];
	shortcut?: string;
	group?: string;
	metadata?: Record<string, unknown>;
	execute(ctx: CommandContext): void | Promise<void>;
}

/** Context available when a command executes. */
export interface CommandContext {
	params?: string;
	flags: Record<string, boolean | string | undefined>;
	closePalette(): void;
}

/** Registry for commands. */
export interface CommandRegistry {
	register(command: CommandItem): () => void;
	unregister(id: string): void;
	find(query: string): CommandItem[];
	getById(id: string): CommandItem | undefined;
}

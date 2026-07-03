/** A keyboard shortcut binding. */
export interface ShortcutBinding {
	id: string;
	label: string;
	key: string;
	modifier?: ("ctrl" | "alt" | "shift" | "meta")[];
	when?: string;
	handler(event: KeyboardEvent): void | Promise<void>;
}

/** Registry for keyboard shortcuts. */
export interface KeyboardRegistry {
	register(binding: ShortcutBinding): () => void;
	unregister(id: string): void;
	match(event: KeyboardEvent): ShortcutBinding | undefined;
}

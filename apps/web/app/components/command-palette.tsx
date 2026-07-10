import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/lib/cn";
import { coreCommands, getCommandIcon } from "~/lib/commands";
import { useShortcut } from "~/lib/keyboard-registry";
import { useUIStore } from "~/stores/ui-store";
import { Input } from "./ui/input";

export function CommandPalette() {
	const open = useUIStore((state) => state.commandPaletteOpen);
	const setOpen = useUIStore((state) => state.setCommandPaletteOpen);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useShortcut({
		id: "palette:toggle",
		label: "Toggle command palette",
		key: "k",
		modifier: ["meta"],
		handler: () => setOpen(!useUIStore.getState().commandPaletteOpen),
	});

	useShortcut({
		id: "palette:close",
		label: "Close command palette",
		key: "Escape",
		handler: () => {
			if (useUIStore.getState().commandPaletteOpen) setOpen(false);
		},
	});

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return coreCommands;
		return coreCommands.filter(
			(cmd) =>
				cmd.label.toLowerCase().includes(q) ||
				cmd.keywords?.some((k) => k.toLowerCase().includes(q)),
		);
	}, [query]);

	useEffect(() => {
		if (open) {
			inputRef.current?.focus();
			setQuery("");
			setActiveIndex(0);
		}
	}, [open]);

	function executeCommand(index: number) {
		const cmd = filtered[index];
		if (!cmd) return;
		cmd.execute({
			closePalette: () => setOpen(false),
			flags: {},
		});
	}

	function handleListKeyDown(event: React.KeyboardEvent) {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((prev) => (prev + 1) % filtered.length);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
		} else if (event.key === "Enter") {
			event.preventDefault();
			executeCommand(activeIndex);
		}
	}

	useEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const activeEl = list.children[activeIndex] as HTMLElement | undefined;
		activeEl?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[20vh]">
			<div
				className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl"
				onKeyDown={handleListKeyDown}
			>
				<div className="flex items-center border-b px-4 py-3">
					<Search className="mr-3 h-5 w-5 text-muted-foreground" />
					<Input
						ref={inputRef}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setActiveIndex(0);
						}}
						placeholder="Type a command or search..."
						className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
					/>
					<span className="ml-3 rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
						ESC
					</span>
				</div>
				<div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
					{filtered.length === 0 && (
						<div className="px-4 py-6 text-center text-sm text-muted-foreground">
							No commands found.
						</div>
					)}
					{filtered.map((cmd, index) => {
						const Icon = getCommandIcon(cmd.icon);
						return (
							<button
								key={cmd.id}
								type="button"
								className={cn(
									"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
									index === activeIndex && "bg-accent text-accent-foreground",
								)}
								onClick={() => executeCommand(index)}
								onMouseEnter={() => setActiveIndex(index)}
							>
								{Icon ? <Icon className="h-4 w-4" /> : null}
								<span className="flex-1">{cmd.label}</span>
								{cmd.group && <span className="text-xs text-muted-foreground">{cmd.group}</span>}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

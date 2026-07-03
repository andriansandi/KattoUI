import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/lib/cn";
import { coreCommands, getCommandIcon } from "~/lib/commands";
import { useUIStore } from "~/stores/ui-store";
import { Input } from "./ui/input";

export function CommandPalette() {
	const open = useUIStore((state) => state.commandPaletteOpen);
	const setOpen = useUIStore((state) => state.setCommandPaletteOpen);
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen(!open);
			}
			if (event.key === "Escape" && open) {
				setOpen(false);
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, setOpen]);

	useEffect(() => {
		if (open) {
			inputRef.current?.focus();
			setQuery("");
		}
	}, [open]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return coreCommands;
		return coreCommands.filter(
			(cmd) =>
				cmd.label.toLowerCase().includes(q) ||
				cmd.keywords?.some((k) => k.toLowerCase().includes(q)),
		);
	}, [query]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[20vh]">
			<div className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl">
				<div className="flex items-center border-b px-4 py-3">
					<Search className="mr-3 h-5 w-5 text-muted-foreground" />
					<Input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Type a command or search..."
						className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
					/>
					<span className="ml-3 rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
						ESC
					</span>
				</div>
				<div className="max-h-[50vh] overflow-y-auto p-2">
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
									index === 0 && "bg-accent/50",
								)}
								onClick={() => {
									cmd.execute({
										closePalette: () => setOpen(false),
										flags: {},
									});
								}}
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

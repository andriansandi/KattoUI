import { Check, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/cn";

export interface DropdownOption {
	value: string;
	label: string;
	icon?: LucideIcon | undefined;
}

export interface DropdownGroup {
	label: string;
	options: DropdownOption[];
}

interface DropdownProps {
	value?: string | undefined;
	/** Flat option list. Mutually exclusive with `groups`. */
	options?: DropdownOption[];
	/** Grouped options with section headers. Mutually exclusive with `options`. */
	groups?: DropdownGroup[];
	placeholder?: string | undefined;
	onChange: (value: string) => void;
	disabled?: boolean | undefined;
	className?: string | undefined;
}

export function Dropdown({
	value,
	options,
	groups,
	placeholder = "Select...",
	onChange,
	disabled = false,
	className,
}: DropdownProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	const flat: DropdownOption[] = groups ? groups.flatMap((g) => g.options) : (options ?? []);
	const selected = flat.find((o) => o.value === value);

	return (
		<div ref={ref} className={cn("relative", className)}>
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen((v) => !v)}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
					"disabled:cursor-not-allowed disabled:opacity-50",
				)}
			>
				<span className="truncate max-w-[160px]">{selected?.label ?? placeholder}</span>
				<ChevronDown className="h-3 w-3 shrink-0" />
			</button>
			{open && (
				<div className="absolute right-0 top-full z-50 mt-1 max-h-72 min-w-[200px] overflow-y-auto rounded-lg border bg-popover py-1 shadow-md">
					{groups
						? groups.map((group) => (
								<div key={group.label}>
									<div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
										{group.label}
									</div>
									{group.options.map((option) => {
										const Icon = option.icon;
										return (
											<button
												key={option.value}
												type="button"
												onClick={() => {
													onChange(option.value);
													setOpen(false);
												}}
												className={cn(
													"flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent",
													option.value === value && "font-medium text-foreground",
												)}
											>
												<span className="flex items-center gap-1.5 truncate">
													{Icon && <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />}
													{option.label}
												</span>
												{option.value === value && <Check className="ml-2 h-3 w-3 shrink-0" />}
											</button>
										);
									})}
								</div>
							))
						: flat.map((option) => {
								const Icon = option.icon;
								return (
									<button
										key={option.value}
										type="button"
										onClick={() => {
											onChange(option.value);
											setOpen(false);
										}}
										className={cn(
											"flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent",
											option.value === value && "font-medium text-foreground",
										)}
									>
										<span className="flex items-center gap-1.5 truncate">
											{Icon && <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />}
											{option.label}
										</span>
										{option.value === value && <Check className="ml-2 h-3 w-3 shrink-0" />}
									</button>
								);
							})}
				</div>
			)}
		</div>
	);
}

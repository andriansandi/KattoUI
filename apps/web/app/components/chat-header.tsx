import { useNavigate } from "@tanstack/react-router";
import { Brain, Menu, MoreHorizontal, Pencil, Pin, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { Dropdown } from "~/components/ui/dropdown";
import type { DropdownGroup } from "~/components/ui/dropdown";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/cn";
import { useDeleteConversation, useUpdateConversation } from "~/lib/queries/conversations";
import { useAllEnabledModels } from "~/lib/queries/provider-configs";

interface ChatHeaderProps {
	conversationId: string;
	title: string;
	pinned: boolean;
	favorited: boolean;
	selectedModel?: string | undefined;
	selectedProviderConfigId?: string | undefined;
	onModelChange: (providerConfigId: string, model: string) => void;
	onToggleMobileSidebar: () => void;
}

function compositeKey(providerConfigId: string, model: string): string {
	return `${providerConfigId}:${model}`;
}

function splitComposite(value: string): { providerConfigId: string; model: string } {
	const sep = value.indexOf(":");
	return { providerConfigId: value.slice(0, sep), model: value.slice(sep + 1) };
}

interface MenuAction {
	label: string;
	icon: LucideIcon;
	onClick: () => void;
	destructive?: boolean;
}

function MoreMenu({ actions }: { actions: MenuAction[] }) {
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

	return (
		<div ref={ref} className="relative">
			<Button
				variant="ghost"
				size="icon"
				aria-label="More actions"
				onClick={() => setOpen((v) => !v)}
			>
				<MoreHorizontal className="h-4 w-4" />
			</Button>
			{open && (
				<div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border bg-popover py-1 shadow-md">
					{actions.map((action) => {
						const Icon = action.icon;
						return (
							<button
								key={action.label}
								type="button"
								className={cn(
									"flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent",
									action.destructive ? "text-destructive" : "text-foreground",
								)}
								onClick={() => {
									setOpen(false);
									action.onClick();
								}}
							>
								<Icon className="h-3 w-3" />
								{action.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

export function ChatHeader({
	conversationId,
	title,
	pinned,
	favorited,
	selectedModel,
	selectedProviderConfigId,
	onModelChange,
	onToggleMobileSidebar,
}: ChatHeaderProps) {
	const { data: allModels } = useAllEnabledModels();
	const updateConversation = useUpdateConversation();
	const deleteConversation = useDeleteConversation();
	const navigate = useNavigate();

	const [renaming, setRenaming] = useState(false);
	const [editValue, setEditValue] = useState(title);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const groups: DropdownGroup[] = (allModels?.groups ?? []).map((g) => ({
		label: g.providerName,
		options: g.models.map((m) => ({
			value: compositeKey(g.providerConfigId, m.id),
			label: m.name,
			icon: m.reasoning ? Brain : undefined,
		})),
	}));

	const currentValue =
		selectedProviderConfigId !== undefined && selectedModel !== undefined
			? compositeKey(selectedProviderConfigId, selectedModel)
			: undefined;

	const hasCurrent = groups.some((g) => g.options.some((o) => o.value === currentValue));
	if (!hasCurrent && currentValue !== undefined && selectedModel !== undefined) {
		groups.unshift({
			label: "Current",
			options: [{ value: currentValue, label: selectedModel }],
		});
	}

	function handleChange(value: string) {
		const { providerConfigId, model } = splitComposite(value);
		onModelChange(providerConfigId, model);
	}

	function startRename() {
		setEditValue(title);
		setRenaming(true);
	}

	function saveRename() {
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== title) {
			updateConversation.mutate({ id: conversationId, title: trimmed });
		}
		setRenaming(false);
	}

	function confirmDelete() {
		deleteConversation.mutate(conversationId);
		setConfirmingDelete(false);
		navigate({ to: "/chat" });
	}

	const menuActions: MenuAction[] = [
		{
			label: pinned ? "Unpin" : "Pin",
			icon: Pin,
			onClick: () => updateConversation.mutate({ id: conversationId, pinned: !pinned }),
		},
		{
			label: favorited ? "Unfavorite" : "Favorite",
			icon: Brain,
			onClick: () => updateConversation.mutate({ id: conversationId, favorited: !favorited }),
		},
		{ label: "Rename", icon: Pencil, onClick: startRename },
		{ label: "Delete", icon: Trash2, onClick: () => setConfirmingDelete(true), destructive: true },
	];

	return (
		<>
			<div className="flex h-14 flex-shrink-0 items-center gap-2 border-b px-4">
				<Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileSidebar}>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>
				<h1 className="flex-1 truncate text-sm font-semibold">{title}</h1>
				{groups.length > 0 ? (
					<Dropdown
						value={currentValue}
						groups={groups}
						placeholder="Model"
						onChange={handleChange}
					/>
				) : (
					<span className="text-xs font-medium text-muted-foreground">No model</span>
				)}
				<MoreMenu actions={menuActions} />
			</div>

			<Dialog
				open={renaming}
				onOpenChange={(o) => {
					if (!o) setRenaming(false);
				}}
				title="Rename conversation"
				footer={
					<>
						<Button variant="ghost" size="sm" onClick={() => setRenaming(false)}>
							Cancel
						</Button>
						<Button size="sm" onClick={saveRename}>
							Save
						</Button>
					</>
				}
			>
				<Input
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					autoFocus
					onSelect={(e) => e.currentTarget.select()}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							saveRename();
						}
					}}
				/>
			</Dialog>

			<Dialog
				open={confirmingDelete}
				onOpenChange={(o) => {
					if (!o) setConfirmingDelete(false);
				}}
				title="Delete conversation?"
				description="This will permanently delete the conversation and all its messages. This cannot be undone."
				footer={
					<>
						<Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
							Cancel
						</Button>
						<Button variant="destructive" size="sm" onClick={confirmDelete}>
							Delete
						</Button>
					</>
				}
			/>
		</>
	);
}

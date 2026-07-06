import { UserButton } from "@clerk/clerk-react";
import type { ConversationSummary } from "@katto/sdk";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	MessageSquarePlus,
	MoreHorizontal,
	Pencil,
	Pin,
	Search,
	Settings,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "~/components/client-only";
import { KattoLogo } from "~/components/logo";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/cn";
import {
	useConversations,
	useCreateConversation,
	useDeleteConversation,
	useUpdateConversation,
} from "~/lib/queries/conversations";
import { useUIStore } from "~/stores/ui-store";

function formatRelativeTime(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const minutes = Math.floor(diff / 60_000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 7) return new Date(timestamp).toLocaleDateString();
	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return "just now";
}

export function ChatSidebar() {
	return (
		<ClientOnly fallback={<div className="h-full w-full border-r bg-card" />}>
			<ChatSidebarContent />
		</ClientOnly>
	);
}

function ChatSidebarContent() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const activeId = pathname.match(/^\/chat\/(.+)$/)?.[1];
	const navigate = useNavigate();
	const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);

	const [search, setSearch] = useState("");
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

	const { data, isLoading, isError, refetch } = useConversations();
	const createMutation = useCreateConversation();
	const updateMutation = useUpdateConversation();
	const deleteMutation = useDeleteConversation();

	const conversations = data?.conversations ?? [];
	const filtered = (
		search.trim()
			? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
			: conversations
	)
		.slice()
		.sort((a, b) => {
			if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
			return 0;
		});

	function handleNewChat() {
		createMutation.mutate(
			{},
			{
				onSuccess: (conversation) => {
					navigate({ to: "/chat/$conversationId", params: { conversationId: conversation.id } });
					setMobileSidebarOpen(false);
				},
			},
		);
	}

	function startRename(c: ConversationSummary) {
		setRenamingId(c.id);
		setEditValue(c.title);
		setConfirmingDeleteId(null);
	}

	function saveRename(id: string) {
		const trimmed = editValue.trim();
		const current = conversations.find((c) => c.id === id);
		if (trimmed && trimmed !== current?.title) {
			updateMutation.mutate({ id, title: trimmed });
		}
		setRenamingId(null);
	}

	function confirmDelete(id: string) {
		deleteMutation.mutate(id);
		setConfirmingDeleteId(null);
		if (id === activeId) {
			navigate({ to: "/chat" });
		}
	}

	return (
		<aside className="flex h-full w-full flex-col border-r bg-card">
			<div className="flex h-14 flex-shrink-0 items-center border-b px-4">
				<Link to="/chat" className="flex items-center gap-2 font-semibold text-foreground">
					<KattoLogo className="h-5 w-5 text-primary" />
					<span>KattoUI</span>
				</Link>
			</div>

			<div className="space-y-2 p-3">
				<Button
					className="w-full justify-start gap-2"
					onClick={handleNewChat}
					disabled={createMutation.isPending}
				>
					<MessageSquarePlus className="h-4 w-4" />
					New Chat
				</Button>
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search conversations"
						className="pl-9"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				{isLoading ? (
					<div className="space-y-2 p-1">
						<Skeleton className="h-14 w-full rounded-lg" />
						<Skeleton className="h-14 w-full rounded-lg" />
						<Skeleton className="h-14 w-full rounded-lg" />
						<Skeleton className="h-14 w-full rounded-lg" />
					</div>
				) : isError ? (
					<div className="p-4 text-center">
						<p className="text-sm text-muted-foreground">Failed to load conversations</p>
						<Button variant="ghost" size="sm" className="mt-2" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				) : filtered.length === 0 ? (
					<div className="p-4 text-center">
						<p className="text-sm text-muted-foreground">
							{search.trim() ? "No matches found" : "No conversations yet"}
						</p>
					</div>
				) : (
					<div className="space-y-0.5">
						{filtered.map((c) => (
							<ConversationItem
								key={c.id}
								conversation={c}
								isActive={c.id === activeId}
								onTogglePin={() => updateMutation.mutate({ id: c.id, pinned: !c.pinned })}
								onStartRename={() => startRename(c)}
								onRequestDelete={() => setConfirmingDeleteId(c.id)}
								onNavigate={() => setMobileSidebarOpen(false)}
							/>
						))}
					</div>
				)}
			</div>

			<div className="flex flex-shrink-0 items-center justify-between border-t p-3">
				<Link
					to="/settings/providers"
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
					onClick={() => setMobileSidebarOpen(false)}
				>
					<Settings className="h-4 w-4" />
					Settings
				</Link>
				<ClientOnly fallback={<Avatar fallback="G" size="sm" />}>
					<UserButton afterSignOutUrl="/" />
				</ClientOnly>
			</div>

			<RenameConversationDialog
				open={renamingId !== null}
				editValue={editValue}
				onEditValueChange={setEditValue}
				onSave={() => renamingId && saveRename(renamingId)}
				onCancel={() => setRenamingId(null)}
			/>
			<DeleteConversationDialog
				open={confirmingDeleteId !== null}
				onConfirm={() => confirmingDeleteId && confirmDelete(confirmingDeleteId)}
				onCancel={() => setConfirmingDeleteId(null)}
			/>
		</aside>
	);
}

interface ConversationItemProps {
	conversation: ConversationSummary;
	isActive: boolean;
	onTogglePin: () => void;
	onStartRename: () => void;
	onRequestDelete: () => void;
	onNavigate: () => void;
}

function ConversationItem({
	conversation,
	isActive,
	onTogglePin,
	onStartRename,
	onRequestDelete,
	onNavigate,
}: ConversationItemProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen]);

	return (
		<div
			className={cn(
				"group relative flex items-center rounded-lg transition-colors",
				isActive ? "bg-accent" : "hover:bg-accent/50",
			)}
		>
			<Link
				to="/chat/$conversationId"
				params={{ conversationId: conversation.id }}
				className="min-w-0 flex-1 px-3 py-2 pr-8"
				onClick={onNavigate}
				onDoubleClick={(e) => {
					e.preventDefault();
					onStartRename();
				}}
			>
				<p className="flex items-center gap-1 truncate text-sm font-medium">
					{conversation.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
					<span className="truncate">{conversation.title}</span>
				</p>
				{conversation.preview?.firstUser ? (
					<p className="truncate text-xs text-muted-foreground">
						<span className="text-foreground/70">You:</span>{" "}
						{conversation.preview.firstUser.content}
					</p>
				) : (
					<p className="truncate text-xs text-muted-foreground">
						{formatRelativeTime(conversation.updatedAt)}
					</p>
				)}
				{conversation.preview?.lastAssistant ? (
					<p className="truncate text-xs text-muted-foreground/70">
						{conversation.preview.lastAssistant.content}
					</p>
				) : null}
			</Link>
			<div className={cn("absolute right-1 top-1", menuOpen ? "flex" : "hidden group-hover:flex")}>
				<div ref={menuRef} className="relative">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setMenuOpen((v) => !v);
						}}
					>
						<MoreHorizontal className="h-3 w-3" />
						<span className="sr-only">More actions</span>
					</Button>
					{menuOpen && (
						<div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border bg-popover py-1 shadow-md">
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
								onClick={() => {
									setMenuOpen(false);
									onTogglePin();
								}}
							>
								<Pin
									className={cn("h-3 w-3", conversation.pinned && "fill-current text-primary")}
								/>
								{conversation.pinned ? "Unpin" : "Pin"}
							</button>
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
								onClick={() => {
									setMenuOpen(false);
									onStartRename();
								}}
							>
								<Pencil className="h-3 w-3" />
								Rename
							</button>
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-accent"
								onClick={() => {
									setMenuOpen(false);
									onRequestDelete();
								}}
							>
								<Trash2 className="h-3 w-3" />
								Delete
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

interface RenameConversationDialogProps {
	open: boolean;
	editValue: string;
	onEditValueChange: (value: string) => void;
	onSave: () => void;
	onCancel: () => void;
}

function RenameConversationDialog({
	open,
	editValue,
	onEditValueChange,
	onSave,
	onCancel,
}: RenameConversationDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [open]);

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) onCancel();
			}}
			title="Rename conversation"
			footer={
				<>
					<Button variant="ghost" size="sm" onClick={onCancel}>
						Cancel
					</Button>
					<Button size="sm" onClick={onSave}>
						Save
					</Button>
				</>
			}
		>
			<Input
				ref={inputRef}
				value={editValue}
				onChange={(e) => onEditValueChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						onSave();
					}
				}}
			/>
		</Dialog>
	);
}

interface DeleteConversationDialogProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

function DeleteConversationDialog({ open, onConfirm, onCancel }: DeleteConversationDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) onCancel();
			}}
			title="Delete conversation?"
			description="This will permanently delete the conversation and all its messages. This cannot be undone."
			footer={
				<>
					<Button variant="ghost" size="sm" onClick={onCancel}>
						Cancel
					</Button>
					<Button variant="destructive" size="sm" onClick={onConfirm}>
						Delete
					</Button>
				</>
			}
		/>
	);
}

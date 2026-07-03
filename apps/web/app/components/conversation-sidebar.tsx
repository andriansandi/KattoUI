import type { ConversationSummary } from "@katto/sdk";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Check, MessageSquarePlus, Pencil, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "~/components/client-only";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/cn";
import {
	useConversations,
	useCreateConversation,
	useDeleteConversation,
	useUpdateConversation,
} from "~/lib/queries/conversations";

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

export function ConversationSidebar() {
	return (
		<ClientOnly fallback={<aside className="w-64 flex-shrink-0 border-r bg-card" />}>
			<SidebarContent />
		</ClientOnly>
	);
}

function SidebarContent() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const activeId = pathname.match(/^\/chat\/(.+)$/)?.[1];
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

	const { data, isLoading, isError, refetch } = useConversations();
	const createMutation = useCreateConversation();
	const updateMutation = useUpdateConversation();
	const deleteMutation = useDeleteConversation();

	const conversations = data?.conversations ?? [];
	const filtered = search.trim()
		? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
		: conversations;

	function handleNewChat() {
		createMutation.mutate(
			{},
			{
				onSuccess: (conversation) => {
					navigate({ to: "/chat/$conversationId", params: { conversationId: conversation.id } });
				},
			},
		);
	}

	function startEdit(c: ConversationSummary) {
		setEditingId(c.id);
		setEditValue(c.title);
		setConfirmingDeleteId(null);
	}

	function saveEdit(id: string) {
		const trimmed = editValue.trim();
		const current = conversations.find((c) => c.id === id);
		if (trimmed && trimmed !== current?.title) {
			updateMutation.mutate({ id, title: trimmed });
		}
		setEditingId(null);
	}

	function confirmDelete(id: string) {
		deleteMutation.mutate(id);
		setConfirmingDeleteId(null);
		if (id === activeId) {
			navigate({ to: "/chat" });
		}
	}

	return (
		<aside className="flex w-64 flex-shrink-0 flex-col border-r bg-card">
			<div className="flex h-14 items-center justify-between border-b px-4">
				<h2 className="font-semibold">Chats</h2>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleNewChat}
					disabled={createMutation.isPending}
				>
					<MessageSquarePlus className="h-4 w-4" />
					<span className="sr-only">New chat</span>
				</Button>
			</div>

			<div className="border-b p-3">
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search chats"
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
								isEditing={editingId === c.id}
								isConfirmingDelete={confirmingDeleteId === c.id}
								editValue={editValue}
								onEditValueChange={setEditValue}
								onStartEdit={() => startEdit(c)}
								onSaveEdit={() => saveEdit(c.id)}
								onCancelEdit={() => setEditingId(null)}
								onRequestDelete={() => setConfirmingDeleteId(c.id)}
								onConfirmDelete={() => confirmDelete(c.id)}
								onCancelDelete={() => setConfirmingDeleteId(null)}
							/>
						))}
					</div>
				)}
			</div>
		</aside>
	);
}

interface ConversationItemProps {
	conversation: ConversationSummary;
	isActive: boolean;
	isEditing: boolean;
	isConfirmingDelete: boolean;
	editValue: string;
	onEditValueChange: (value: string) => void;
	onStartEdit: () => void;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	onRequestDelete: () => void;
	onConfirmDelete: () => void;
	onCancelDelete: () => void;
}

function ConversationItem({
	conversation,
	isActive,
	isEditing,
	isConfirmingDelete,
	editValue,
	onEditValueChange,
	onStartEdit,
	onSaveEdit,
	onCancelEdit,
	onRequestDelete,
	onConfirmDelete,
	onCancelDelete,
}: ConversationItemProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing]);

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			onSaveEdit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCancelEdit();
		}
	}

	if (isConfirmingDelete) {
		return (
			<div className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-2">
				<span className="flex-1 truncate text-xs text-destructive">Delete?</span>
				<Button variant="destructive" size="icon" className="h-6 w-6" onClick={onConfirmDelete}>
					<Check className="h-3 w-3" />
				</Button>
				<Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelDelete}>
					<X className="h-3 w-3" />
				</Button>
			</div>
		);
	}

	if (isEditing) {
		return (
			<div className="rounded-lg bg-accent px-2 py-1.5">
				<input
					ref={inputRef}
					value={editValue}
					onChange={(e) => onEditValueChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={onSaveEdit}
					className="w-full rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
				/>
			</div>
		);
	}

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
				className="min-w-0 flex-1 px-3 py-2"
				onDoubleClick={(e) => {
					e.preventDefault();
					onStartEdit();
				}}
			>
				<p className="truncate text-sm font-medium">{conversation.title}</p>
				<p className="text-xs text-muted-foreground">
					{formatRelativeTime(conversation.updatedAt)}
				</p>
			</Link>
			<div className="absolute right-1 top-1 hidden items-center gap-0.5 group-hover:flex">
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onStartEdit();
					}}
				>
					<Pencil className="h-3 w-3" />
					<span className="sr-only">Rename</span>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-muted-foreground hover:text-destructive"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onRequestDelete();
					}}
				>
					<Trash2 className="h-3 w-3" />
					<span className="sr-only">Delete</span>
				</Button>
			</div>
		</div>
	);
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "~/components/chat-composer";
import { ChatHeader } from "~/components/chat-header";
import { MessageItem } from "~/components/chat-message";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useConversations, useGenerateTitle } from "~/lib/queries/conversations";
import { useMessages } from "~/lib/queries/messages";
import { useStreamChat } from "~/lib/queries/stream-chat";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
	component: ChatConversationPage,
});

function ChatConversationPage() {
	const { conversationId } = useParams({
		from: "/_authenticated/chat/$conversationId",
	});
	const { data: convData } = useConversations();
	const conversation = convData?.conversations.find((c) => c.id === conversationId);
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
	const pendingMessage = useUIStore((s) => s.pendingMessage);
	const setPendingMessage = useUIStore((s) => s.setPendingMessage);

	const { data, isLoading, isError, refetch } = useMessages(conversationId);
	const streamChat = useStreamChat(conversationId);
	const generateTitle = useGenerateTitle();

	const [input, setInput] = useState("");

	const scrollRef = useRef<HTMLDivElement>(null);
	const messages = data?.messages ?? [];

	const didHandlePending = useRef(false);
	useEffect(() => {
		if (
			!pendingMessage ||
			didHandlePending.current ||
			streamChat.isStreaming ||
			pendingMessage.conversationId !== conversationId
		)
			return;
		didHandlePending.current = true;
		setPendingMessage(null);
		void handleSend(pendingMessage.content);
	}, [pendingMessage, streamChat.isStreaming, conversationId, setPendingMessage]);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el || (messages.length === 0 && !streamChat.streamingContent)) return;
		el.scrollTop = el.scrollHeight;
	}, [messages, streamChat.streamingContent]);

	async function handleSend(content?: string) {
		const text = content ?? input;
		if (!text.trim() || streamChat.isStreaming) return;
		const isFirst = messages.length === 0;
		setInput("");
		await streamChat.send(text);
		if (isFirst) generateTitle.mutate(conversationId);
	}

	return (
		<div className="flex h-full w-full flex-col">
			<ChatHeader
				title={conversation?.title ?? "Chat"}
				model={conversation?.model}
				providerConfigId={conversation?.providerConfigId}
				conversationId={conversationId}
				onToggleMobileSidebar={toggleMobileSidebar}
			/>
			<div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
				{isLoading ? (
					<div className="space-y-6">
						<Skeleton className="h-16 w-3/4 rounded-2xl" />
						<Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
						<Skeleton className="h-16 w-1/2 rounded-2xl" />
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
						<p className="text-sm text-muted-foreground">Failed to load messages</p>
						<Button variant="ghost" size="sm" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				) : messages.length === 0 && !streamChat.isStreaming ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-sm text-muted-foreground">No messages yet</p>
					</div>
				) : (
					<>
						{messages.map((m) => (
							<MessageItem key={m.id} role={m.role} content={m.content} />
						))}
						{streamChat.isStreaming && (
							// biome-ignore lint/a11y/useValidAriaRole: role is a MessageItem prop, not an HTML attribute
							<MessageItem role={"assistant"} content={streamChat.streamingContent} streaming />
						)}
						{streamChat.error && (
							<div className="flex justify-center">
								<p className="text-xs text-destructive">{streamChat.error}</p>
							</div>
						)}
					</>
				)}
			</div>
			<div className="px-4 pb-4 pt-2">
				<ChatComposer
					value={input}
					onChange={setInput}
					onSend={() => handleSend()}
					disabled={streamChat.isStreaming}
					isStreaming={streamChat.isStreaming}
					onStop={streamChat.stop}
				/>
			</div>
		</div>
	);
}

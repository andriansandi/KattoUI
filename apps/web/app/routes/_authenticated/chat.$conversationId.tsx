import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "~/components/chat-composer";
import { ChatHeader } from "~/components/chat-header";
import { MessageItem } from "~/components/chat-message";
import { useConversations } from "~/lib/queries/conversations";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
	component: ChatConversationPage,
});

interface MockMessage {
	role: "user" | "assistant";
	content: string;
}

function ChatConversationPage() {
	const { conversationId } = useParams({
		from: "/_authenticated/chat/$conversationId",
	});
	const { data } = useConversations();
	const conversation = data?.conversations.find((c) => c.id === conversationId);
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

	const [messages, setMessages] = useState<MockMessage[]>([
		{
			role: "user",
			content: "Explain Cloudflare Workers in one paragraph.",
		},
		{
			role: "assistant",
			content:
				"Cloudflare Workers lets you deploy serverless code to Cloudflare's edge network. It runs on V8 isolates, providing instant cold starts, global distribution, and tight integration with storage services like KV, D1, and R2.",
		},
	]);
	const [input, setInput] = useState("");

	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el || messages.length === 0) return;
		el.scrollTop = el.scrollHeight;
	}, [messages]);

	function handleSend() {
		if (!input.trim()) return;
		setMessages((prev) => [...prev, { role: "user", content: input }]);
		setInput("");
		setTimeout(() => {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `This is a placeholder response for conversation ${conversationId}. Streaming and providers will be wired in Slice 5.`,
				},
			]);
		}, 600);
	}

	return (
		<div className="flex h-full w-full flex-col">
			<ChatHeader
				title={conversation?.title ?? "Chat"}
				model={conversation?.model}
				onToggleMobileSidebar={toggleMobileSidebar}
			/>
			<div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
				{messages.map((m, i) => (
					<MessageItem key={i.toString()} role={m.role} content={m.content} />
				))}
			</div>
			<div className="px-4 pb-4 pt-2">
				<ChatComposer value={input} onChange={setInput} onSend={handleSend} />
			</div>
		</div>
	);
}

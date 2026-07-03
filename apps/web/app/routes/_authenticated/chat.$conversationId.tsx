import { createFileRoute, useParams } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useState } from "react";
import { ChatBubble } from "~/components/chat-bubble";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
	component: ChatConversationPage,
});

function ChatConversationPage() {
	const { conversationId } = useParams({
		from: "/_authenticated/chat/$conversationId",
	});
	const [messages, setMessages] = useState([
		{
			role: "user" as const,
			content: "Explain Cloudflare Workers in one paragraph.",
		},
		{
			role: "assistant" as const,
			content:
				"Cloudflare Workers lets you deploy serverless code to Cloudflare's edge network. It runs on V8 isolates, providing instant cold starts, global distribution, and tight integration with storage services like KV, D1, and R2.",
		},
	]);
	const [input, setInput] = useState("");

	function handleSend() {
		if (!input.trim()) return;
		setMessages((prev) => [...prev, { role: "user", content: input }]);
		setInput("");
		setTimeout(() => {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `This is a placeholder response for conversation ${conversationId}. Streaming and providers will be wired in Phase 5.`,
				},
			]);
		}, 600);
	}

	return (
		<div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
			<div className="flex-1 space-y-4 overflow-y-auto py-4">
				{messages.map((m, i) => (
					<ChatBubble key={i.toString()} role={m.role} content={m.content} />
				))}
			</div>
			<div className="flex items-center gap-2 border-t pt-4">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Message KattoUI..."
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
				/>
				<Button onClick={handleSend}>
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

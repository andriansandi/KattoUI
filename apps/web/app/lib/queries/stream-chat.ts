import type { StoredMessage, StreamChatEvent } from "@katto/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { apiUrl } from "~/lib/api";
import { useAuthHeaders } from "~/lib/auth-fetch";

interface MessagesResponse {
	messages: StoredMessage[];
}

const CONVERSATIONS_KEY = ["conversations"] as const;

function messagesKey(conversationId: string) {
	return ["messages", conversationId] as const;
}

interface UseStreamChatResult {
	send: (content: string) => Promise<void>;
	stop: () => void;
	isStreaming: boolean;
	streamingContent: string;
	error: string | null;
}

export function useStreamChat(conversationId: string): UseStreamChatResult {
	const buildHeaders = useAuthHeaders();
	const qc = useQueryClient();
	const key = messagesKey(conversationId);

	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const send = useCallback(
		async (content: string) => {
			if (isStreaming || !content.trim()) return;

			setError(null);
			setIsStreaming(true);
			setStreamingContent("");

			await qc.cancelQueries({ queryKey: key });

			const tempId = `temp-${Date.now()}`;
			const tempMessage: StoredMessage = {
				id: tempId,
				conversationId,
				role: "user",
				content,
				createdAt: Date.now(),
			};

			qc.setQueryData<MessagesResponse>(key, (old) => {
				if (!old) return { messages: [tempMessage] };
				return { messages: [...old.messages, tempMessage] };
			});

			const controller = new AbortController();
			abortRef.current = controller;

			try {
				const headers = await buildHeaders();
				const response = await fetch(apiUrl(`/conversations/${conversationId}/messages/stream`), {
					method: "POST",
					headers,
					body: JSON.stringify({ content }),
					signal: controller.signal,
				});

				if (!response.ok) {
					const json = (await response.json().catch(() => null)) as { error?: string } | null;
					throw new Error(json?.error ?? `Request failed: ${response.status}`);
				}

				if (!response.body) {
					throw new Error("No response body");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				let accumulated = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });

					let idx = buffer.indexOf("\n\n");
					while (idx !== -1) {
						const block = buffer.slice(0, idx);
						buffer = buffer.slice(idx + 2);
						const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
						if (dataLine) {
							const jsonStr = dataLine.slice(6);
							let event: StreamChatEvent;
							try {
								event = JSON.parse(jsonStr) as StreamChatEvent;
							} catch {
								idx = buffer.indexOf("\n\n");
								continue;
							}
							if (event.type === "delta") {
								accumulated += event.content;
								setStreamingContent(accumulated);
							} else if (event.type === "error") {
								setError(event.message);
							}
						}
						idx = buffer.indexOf("\n\n");
					}
				}
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") {
					// User stopped generation — partial content is persisted server-side
				} else {
					const message = err instanceof Error ? err.message : "Streaming failed";
					setError(message);
				}
			} finally {
				setIsStreaming(false);
				setStreamingContent("");
				abortRef.current = null;
				qc.invalidateQueries({ queryKey: key });
				qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
			}
		},
		[buildHeaders, isStreaming, key, qc, conversationId],
	);

	const stop = useCallback(() => {
		abortRef.current?.abort();
	}, []);

	return { send, stop, isStreaming, streamingContent, error };
}

import type { StoredMessage, StreamChatEvent, TokenUsage } from "@katto/sdk";
import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { apiUrl } from "~/lib/api";
import { useAuthHeaders } from "~/lib/auth-fetch";

type MessagesData = InfiniteData<{
	messages: StoredMessage[];
	hasMore: boolean;
	nextCursor: number | null;
}>;

const CONVERSATIONS_KEY = ["conversations"] as const;

function messagesKey(conversationId: string) {
	return ["messages", conversationId] as const;
}

interface UseStreamChatResult {
	send: (
		content: string,
		opts?: {
			model?: string;
			providerConfigId?: string;
			regenerate?: boolean;
			replaceMessageId?: string;
			deleteAfterMessageId?: string;
		},
	) => Promise<void>;
	stop: () => void;
	isStreaming: boolean;
	streamingContent: string;
	streamingReasoning: string;
	streamingModel: string | null;
	streamingUsage: TokenUsage | null;
	error: string | null;
}

export function useStreamChat(conversationId: string): UseStreamChatResult {
	const buildHeaders = useAuthHeaders();
	const qc = useQueryClient();
	const key = messagesKey(conversationId);

	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const [streamingReasoning, setStreamingReasoning] = useState("");
	const [streamingModel, setStreamingModel] = useState<string | null>(null);
	const [streamingUsage, setStreamingUsage] = useState<TokenUsage | null>(null);
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const send = useCallback(
		async (
			content: string,
			opts?: {
				model?: string;
				providerConfigId?: string;
				regenerate?: boolean;
				replaceMessageId?: string;
				deleteAfterMessageId?: string;
			},
		) => {
			if (isStreaming || (!content.trim() && !opts?.regenerate)) return;

			setError(null);
			setIsStreaming(true);
			setStreamingContent("");
			setStreamingReasoning("");
			setStreamingModel(null);
			setStreamingUsage(null);

			await qc.cancelQueries({ queryKey: key });

			if (!opts?.regenerate) {
				const tempId = `temp-${Date.now()}`;
				const tempMessage: StoredMessage = {
					id: tempId,
					conversationId,
					role: "user",
					content,
					createdAt: Date.now(),
				};

				qc.setQueryData<MessagesData>(key, (old) => {
					if (!old?.pages?.length) return old;
					const lastIdx = old.pages.length - 1;
					return {
						...old,
						pages: old.pages.map((page, i) =>
							i === lastIdx ? { ...page, messages: [...page.messages, tempMessage] } : page,
						),
					};
				});
			}

			const controller = new AbortController();
			abortRef.current = controller;

			try {
				const headers = await buildHeaders();
				const response = await fetch(apiUrl(`/conversations/${conversationId}/messages/stream`), {
					method: "POST",
					headers,
					body: JSON.stringify({ content, ...opts }),
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
				let reasoningAccumulated = "";

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
							} else if (event.type === "reasoning") {
								reasoningAccumulated += event.content;
								setStreamingReasoning(reasoningAccumulated);
							} else if (event.type === "meta") {
								setStreamingModel(event.model);
							} else if (event.type === "done") {
								if (event.usage) setStreamingUsage(event.usage);
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
				setStreamingReasoning("");
				setStreamingModel(null);
				setStreamingUsage(null);
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

	return {
		send,
		stop,
		isStreaming,
		streamingContent,
		streamingReasoning,
		streamingModel,
		streamingUsage,
		error,
	};
}

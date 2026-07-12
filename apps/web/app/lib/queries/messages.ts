import type { MessageInput, PaginatedMessages, StoredMessage } from "@katto/sdk";
import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthFetch } from "~/lib/auth-fetch";

export type MessageCreateInput = Omit<MessageInput, "conversationId">;

export type MessagesData = InfiniteData<PaginatedMessages>;

const CONVERSATIONS_KEY = ["conversations"] as const;

function messagesKey(conversationId: string) {
	return ["messages", conversationId] as const;
}

export function useMessages(conversationId: string) {
	const authFetch = useAuthFetch();
	return useInfiniteQuery({
		queryKey: messagesKey(conversationId),
		queryFn: ({ pageParam }: { pageParam: number | undefined }) => {
			const url =
				pageParam !== undefined
					? `/conversations/${conversationId}/messages?limit=50&cursor=${pageParam}`
					: `/conversations/${conversationId}/messages?limit=50`;
			return authFetch<PaginatedMessages>(url);
		},
		initialPageParam: undefined as number | undefined,
		getPreviousPageParam: (firstPage: PaginatedMessages) =>
			firstPage.hasMore ? (firstPage.nextCursor ?? undefined) : undefined,
		getNextPageParam: () => undefined,
	});
}

export function useUpdateMessage(conversationId: string) {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	const key = messagesKey(conversationId);

	return useMutation({
		mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
			authFetch<StoredMessage>(`/conversations/${conversationId}/messages/${messageId}`, {
				method: "PATCH",
				body: JSON.stringify({ content }),
			}),
		onSettled: () => {
			qc.invalidateQueries({ queryKey: key });
		},
	});
}

export function useDeleteMessage(conversationId: string) {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	const key = messagesKey(conversationId);

	return useMutation({
		mutationFn: (messageId: string) =>
			authFetch<void>(`/conversations/${conversationId}/messages/${messageId}`, {
				method: "DELETE",
			}),
		onSettled: () => {
			qc.invalidateQueries({ queryKey: key });
		},
	});
}

export function useCreateMessage(conversationId: string) {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	const key = messagesKey(conversationId);

	return useMutation({
		mutationFn: (input: MessageCreateInput) =>
			authFetch<StoredMessage>(`/conversations/${conversationId}/messages`, {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onMutate: async (input) => {
			await qc.cancelQueries({ queryKey: key });
			const previous = qc.getQueryData<MessagesData>(key);

			const tempId = `temp-${Date.now()}`;
			const tempMessage: StoredMessage = {
				id: tempId,
				conversationId,
				role: input.role,
				content: input.content,
				createdAt: Date.now(),
			};
			if (input.model !== undefined) {
				tempMessage.model = input.model;
			}

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

			return { previous, tempId };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				qc.setQueryData(key, context.previous);
			}
		},
		onSuccess: (message, _vars, context) => {
			if (context?.tempId) {
				qc.setQueryData<MessagesData>(key, (old) => {
					if (!old?.pages?.length) return old;
					const lastIdx = old.pages.length - 1;
					return {
						...old,
						pages: old.pages.map((page, i) =>
							i === lastIdx
								? {
										...page,
										messages: page.messages.map((m) => (m.id === context.tempId ? message : m)),
									}
								: page,
						),
					};
				});
			}
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: key });
			qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
		},
	});
}

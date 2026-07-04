import type { MessageInput, StoredMessage } from "@katto/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthFetch } from "~/lib/auth-fetch";

export type MessageCreateInput = Omit<MessageInput, "conversationId">;

interface MessagesResponse {
	messages: StoredMessage[];
}

const CONVERSATIONS_KEY = ["conversations"] as const;

function messagesKey(conversationId: string) {
	return ["messages", conversationId] as const;
}

export function useMessages(conversationId: string) {
	const authFetch = useAuthFetch();
	return useQuery({
		queryKey: messagesKey(conversationId),
		queryFn: () => authFetch<MessagesResponse>(`/conversations/${conversationId}/messages`),
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
			const previous = qc.getQueryData<MessagesResponse>(key);

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

			qc.setQueryData<MessagesResponse>(key, (old) => {
				if (!old) return { messages: [tempMessage] };
				return { messages: [...old.messages, tempMessage] };
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
				qc.setQueryData<MessagesResponse>(key, (old) => {
					if (!old) return { messages: [message] };
					return {
						messages: old.messages.map((m) => (m.id === context.tempId ? message : m)),
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

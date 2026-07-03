import type {
	Conversation,
	ConversationInput,
	ConversationSummary,
	ConversationUpdate,
} from "@katto/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthFetch } from "~/lib/auth-fetch";

const QUERY_KEY = ["conversations"] as const;

interface ConversationsResponse {
	conversations: ConversationSummary[];
}

export function useConversations() {
	const authFetch = useAuthFetch();
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: () => authFetch<ConversationsResponse>("/conversations"),
	});
}

export function useCreateConversation() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: ConversationInput) =>
			authFetch<Conversation>("/conversations", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: (conversation) => {
			const summary: ConversationSummary = {
				id: conversation.id,
				title: conversation.title,
				pinned: conversation.pinned,
				favorited: conversation.favorited,
				updatedAt: conversation.updatedAt,
			};
			if (conversation.model !== undefined) {
				summary.model = conversation.model;
			}
			qc.setQueryData<ConversationsResponse>(QUERY_KEY, (old) => {
				if (!old) return { conversations: [summary] };
				return {
					conversations: [summary, ...old.conversations],
				};
			});
		},
	});
}

export function useUpdateConversation() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...update }: ConversationUpdate & { id: string }) =>
			authFetch<Conversation>(`/conversations/${id}`, {
				method: "PATCH",
				body: JSON.stringify(update),
			}),
		onMutate: async ({ id, ...update }) => {
			await qc.cancelQueries({ queryKey: QUERY_KEY });
			const previous = qc.getQueryData<ConversationsResponse>(QUERY_KEY);
			qc.setQueryData<ConversationsResponse>(QUERY_KEY, (old) => {
				if (!old) return old;
				return {
					conversations: old.conversations.map((c) => {
						if (c.id !== id) return c;
						const next: ConversationSummary = { ...c, updatedAt: Date.now() };
						if (update.title !== undefined) next.title = update.title;
						if (update.model !== undefined) next.model = update.model;
						if (update.pinned !== undefined) next.pinned = update.pinned;
						if (update.favorited !== undefined) next.favorited = update.favorited;
						return next;
					}),
				};
			});
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				qc.setQueryData(QUERY_KEY, context.previous);
			}
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteConversation() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => authFetch<void>(`/conversations/${id}`, { method: "DELETE" }),
		onMutate: async (id) => {
			await qc.cancelQueries({ queryKey: QUERY_KEY });
			const previous = qc.getQueryData<ConversationsResponse>(QUERY_KEY);
			qc.setQueryData<ConversationsResponse>(QUERY_KEY, (old) => {
				if (!old) return old;
				return {
					conversations: old.conversations.filter((c) => c.id !== id),
				};
			});
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				qc.setQueryData(QUERY_KEY, context.previous);
			}
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

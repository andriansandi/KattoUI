import type {
	ProviderConfig,
	ProviderConfigInput,
	ProviderConfigUpdate,
	ProviderType,
} from "@katto/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthFetch } from "~/lib/auth-fetch";

const QUERY_KEY = ["provider-configs"] as const;

interface ProviderConfigsResponse {
	providerConfigs: ProviderConfig[];
}

export interface TestConnectionResult {
	ok: boolean;
	models?: string[];
	error?: string;
}

export function useProviderConfigs() {
	const authFetch = useAuthFetch();
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: () => authFetch<ProviderConfigsResponse>("/provider-configs"),
	});
}

export function useCreateProviderConfig() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: ProviderConfigInput) =>
			authFetch<ProviderConfig>("/provider-configs", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useUpdateProviderConfig() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...update }: ProviderConfigUpdate & { id: string }) =>
			authFetch<ProviderConfig>(`/provider-configs/${id}`, {
				method: "PATCH",
				body: JSON.stringify(update),
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useDeleteProviderConfig() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => authFetch<void>(`/provider-configs/${id}`, { method: "DELETE" }),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useTestProviderConfig() {
	const authFetch = useAuthFetch();
	return useMutation({
		mutationFn: (input: {
			type: ProviderType;
			baseUrl: string;
			apiToken?: string;
			defaultModel?: string;
		}) =>
			authFetch<TestConnectionResult>("/provider-configs/test", {
				method: "POST",
				body: JSON.stringify(input),
			}),
	});
}

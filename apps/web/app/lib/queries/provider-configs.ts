import type {
	ProviderConfig,
	ProviderConfigInput,
	ProviderConfigUpdate,
	ProviderModelEntry,
	ProviderModelGroup,
	ProviderStatus,
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
	status?: ProviderStatus;
	latencyMs?: number;
	message?: string;
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

/** Tests a saved provider config and persists the health result server-side. */
export function useTestSavedProviderConfig() {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			authFetch<TestConnectionResult>(`/provider-configs/${id}/test`, { method: "POST" }),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

interface ProviderModelsResponse {
	models: ProviderModelEntry[];
}

interface AllEnabledModelsResponse {
	groups: ProviderModelGroup[];
}

/** Enabled models across all provider configs, grouped by config (chat selector). */
export function useAllEnabledModels() {
	const authFetch = useAuthFetch();
	return useQuery({
		queryKey: ["provider-models-all"],
		queryFn: () => authFetch<AllEnabledModelsResponse>("/provider-configs/models"),
	});
}

export function useProviderModels(configId: string | undefined) {
	const authFetch = useAuthFetch();
	return useQuery({
		queryKey: ["provider-models", configId],
		enabled: configId !== undefined,
		queryFn: () => authFetch<ProviderModelsResponse>(`/provider-configs/${configId}/models`),
	});
}

/** Adds a model to a provider's catalog (enabled by default). */
export function useAddProviderModel(configId: string) {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: { modelId: string; name?: string }) =>
			authFetch<ProviderModelsResponse>(`/provider-configs/${configId}/models`, {
				method: "POST",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["provider-models", configId] });
			qc.invalidateQueries({ queryKey: ["provider-models-all"] });
		},
	});
}

/** Removes a model from a provider's catalog. */
export function useDeleteProviderModel(configId: string) {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (modelId: string) =>
			authFetch<void>(`/provider-configs/${configId}/models/${modelId}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["provider-models", configId] });
			qc.invalidateQueries({ queryKey: ["provider-models-all"] });
		},
	});
}

/** Toggles enabled state on a provider's catalog models. */
export function useUpdateProviderModels(configId: string) {
	const authFetch = useAuthFetch();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: { models: Array<{ id: string; enabled: boolean; reasoning?: boolean }> }) =>
			authFetch<ProviderModelsResponse>(`/provider-configs/${configId}/models`, {
				method: "PATCH",
				body: JSON.stringify(input),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["provider-models", configId] });
			qc.invalidateQueries({ queryKey: ["provider-models-all"] });
		},
	});
}

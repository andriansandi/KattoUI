import type {
	ProviderConfig,
	ProviderConfigInput,
	ProviderConfigUpdate,
	ProviderType,
} from "@katto/sdk";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	Eye,
	EyeOff,
	Loader2,
	Plug,
	Plus,
	Star,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ClientOnly } from "~/components/client-only";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/cn";
import { formatRelativeTime, statusDotClass, statusLabel } from "~/lib/provider-status";
import {
	useAddProviderModel,
	useCreateProviderConfig,
	useDeleteProviderModel,
	useProviderConfigs,
	useProviderModels,
	useTestProviderConfig,
	useTestSavedProviderConfig,
	useUpdateProviderConfig,
	useUpdateProviderModels,
} from "~/lib/queries/provider-configs";
import { PROVIDER_META } from "./index";

export const Route = createFileRoute("/_authenticated/settings/providers/$id")({
	component: ProviderEditPage,
});

function ProviderEditPage() {
	const { id } = Route.useParams();
	return (
		<ClientOnly
			fallback={
				<Card>
					<CardContent className="py-10 text-center text-sm text-muted-foreground">
						Loading…
					</CardContent>
				</Card>
			}
		>
			<ProviderEditContent id={id} />
		</ClientOnly>
	);
}

function ProviderEditContent({ id }: { id: string }) {
	const isCreate = id === "new";
	const navigate = useNavigate();
	const { data: configsData, isLoading } = useProviderConfigs();
	const config = configsData?.providerConfigs.find((c) => c.id === id);

	if (!isCreate && isLoading) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-sm text-muted-foreground">
					Loading…
				</CardContent>
			</Card>
		);
	}

	if (!isCreate && !config) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-sm text-muted-foreground">Provider not found.</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={() => navigate({ to: "/settings/providers" })}
					>
						Back to providers
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => navigate({ to: "/settings/providers" })}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="text-lg font-semibold">{isCreate ? "Add provider" : config?.name}</h2>
					<p className="text-sm text-muted-foreground">
						{isCreate
							? "Configure a new provider connection."
							: "Manage connection, models, and health."}
					</p>
				</div>
			</div>

			<ConnectionSection isCreate={isCreate} config={config} />

			{!isCreate && config && (
				<>
					<HealthSection config={config} />
					<ModelsSection config={config} />
					<MetadataSection config={config} />
				</>
			)}
		</div>
	);
}

function fieldError(errors: unknown[]): string | null {
	const first = errors[0];
	if (first === undefined || first === null) return null;
	if (typeof first === "object" && first !== null && "message" in first) {
		const msg = (first as { message: unknown }).message;
		if (typeof msg === "string") return msg;
	}
	if (typeof first === "string") return first;
	return null;
}

function ConnectionSection({
	isCreate,
	config,
}: {
	isCreate: boolean;
	config: ProviderConfig | undefined;
}) {
	const createMutation = useCreateProviderConfig();
	const updateMutation = useUpdateProviderConfig();
	const testMutation = useTestProviderConfig();
	const navigate = useNavigate();
	const [showToken, setShowToken] = useState(false);

	const form = useForm({
		defaultValues: {
			name: config?.name ?? "",
			type: (config?.type ?? "openai") as ProviderType,
			baseUrl: config?.baseUrl ?? "",
			apiToken: "",
			defaultModel: config?.defaultModel ?? "",
		},
		onSubmit: async ({ value }) => {
			try {
				if (isCreate) {
					const input: ProviderConfigInput = {
						name: value.name,
						type: value.type,
						baseUrl: value.baseUrl,
						apiToken: value.apiToken,
						defaultModel: value.defaultModel,
					};
					const created = await createMutation.mutateAsync(input);
					navigate({ to: "/settings/providers/$id", params: { id: created.id } });
				} else if (config) {
					const update: ProviderConfigUpdate & { id: string } = {
						id: config.id,
						name: value.name,
						type: value.type,
						baseUrl: value.baseUrl,
						defaultModel: value.defaultModel,
					};
					if (value.apiToken) update.apiToken = value.apiToken;
					await updateMutation.mutateAsync(update);
				}
			} catch {
				// surfaced via mutation state
			}
		},
	});

	const submitting = createMutation.isPending || updateMutation.isPending;
	const submitError = (createMutation.error ?? updateMutation.error)?.message ?? null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Connection</CardTitle>
				<CardDescription>Provider name, endpoint, and API key.</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="type">
						{(field) => (
							<div className="space-y-2">
								<span className="block text-sm font-medium">Type</span>
								<div className="flex gap-1 rounded-lg border p-1">
									{(Object.keys(PROVIDER_META) as ProviderType[]).map((t) => (
										<button
											key={t}
											type="button"
											onClick={() => field.handleChange(t)}
											className={cn(
												"flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
												field.state.value === t
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
											)}
										>
											{PROVIDER_META[t].label}
										</button>
									))}
								</div>
							</div>
						)}
					</form.Field>

					<form.Field
						name="name"
						validators={{ onChange: z.string().min(1, "Name is required").max(100) }}
					>
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="pc-name" className="block text-sm font-medium">
									Name
								</label>
								<Input
									id="pc-name"
									placeholder="My OpenAI"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								{fieldError(field.state.meta.errors) && (
									<p className="text-xs text-destructive">{fieldError(field.state.meta.errors)}</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Subscribe selector={(s) => s.values.type}>
						{(type) => (
							<form.Field
								name="baseUrl"
								validators={{ onChange: z.string().min(1, "Base URL is required").max(500) }}
							>
								{(field) => (
									<div className="space-y-2">
										<label htmlFor="pc-baseurl" className="block text-sm font-medium">
											Endpoint
										</label>
										<Input
											id="pc-baseurl"
											placeholder={PROVIDER_META[type].placeholder}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										{field.state.value && (
											<p className="text-xs text-muted-foreground">
												Chat endpoint: {field.state.value.replace(/\/$/, "")}/
												{PROVIDER_META[type].chatPath}
											</p>
										)}
										{fieldError(field.state.meta.errors) && (
											<p className="text-xs text-destructive">
												{fieldError(field.state.meta.errors)}
											</p>
										)}
									</div>
								)}
							</form.Field>
						)}
					</form.Subscribe>

					<form.Field name="apiToken" validators={{ onChange: z.string().max(1000) }}>
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="pc-token" className="block text-sm font-medium">
									API Key
								</label>
								<div className="relative">
									<Input
										id="pc-token"
										type={showToken ? "text" : "password"}
										placeholder={isCreate ? "sk-..." : "Leave blank to keep current"}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										className="pr-9"
									/>
									<button
										type="button"
										onClick={() => setShowToken((v) => !v)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										aria-label={showToken ? "Hide key" : "Show key"}
									>
										{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								<p className="text-xs text-muted-foreground">
									{isCreate
										? "Stored encrypted (AES-256-GCM). Leave empty for tokenless providers (e.g. local Ollama)."
										: "Stored encrypted. Leave blank to keep the current key."}
								</p>
								{fieldError(field.state.meta.errors) && (
									<p className="text-xs text-destructive">{fieldError(field.state.meta.errors)}</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field name="defaultModel" validators={{ onChange: z.string().max(200) }}>
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="pc-model" className="block text-sm font-medium">
									Default model <span className="text-muted-foreground">(optional)</span>
								</label>
								<Input
									id="pc-model"
									placeholder="gpt-4o"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								{fieldError(field.state.meta.errors) && (
									<p className="text-xs text-destructive">{fieldError(field.state.meta.errors)}</p>
								)}
							</div>
						)}
					</form.Field>

					{!isCreate && (
						<form.Subscribe selector={(s) => s.values}>
							{(values) => (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={testMutation.isPending || !values.baseUrl}
									onClick={() =>
										testMutation.mutate({
											type: values.type,
											baseUrl: values.baseUrl,
											...(values.apiToken ? { apiToken: values.apiToken } : {}),
										})
									}
								>
									{testMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Plug className="h-4 w-4" />
									)}
									Test connection
								</Button>
							)}
						</form.Subscribe>
					)}

					{testMutation.data && (
						<div className="rounded-md border p-3 text-sm">
							{testMutation.data.ok ? (
								<div className="flex flex-wrap items-center gap-2">
									<Check className="h-4 w-4 text-emerald-600" />
									<span className="font-medium">Connected</span>
									{testMutation.data.latencyMs !== undefined && (
										<span className="text-muted-foreground">{testMutation.data.latencyMs}ms</span>
									)}
									{testMutation.data.models && testMutation.data.models.length > 0 && (
										<span className="text-muted-foreground">
											({testMutation.data.models.length} models)
										</span>
									)}
								</div>
							) : (
								<div className="flex items-center gap-2 text-destructive">
									<AlertCircle className="h-4 w-4 shrink-0" />
									<span>{testMutation.data.error}</span>
								</div>
							)}
						</div>
					)}

					<div className="flex items-center gap-2 pt-2">
						<form.Subscribe selector={(s) => s.canSubmit}>
							{(canSubmit) => (
								<Button type="submit" size="sm" disabled={!canSubmit || submitting}>
									{submitting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Check className="h-4 w-4" />
									)}
									{isCreate ? "Create provider" : "Save changes"}
								</Button>
							)}
						</form.Subscribe>
					</div>

					{testMutation.isError && (
						<p className="text-xs text-destructive">Test failed: {testMutation.error?.message}</p>
					)}
					{submitError && <p className="text-xs text-destructive">{submitError}</p>}
				</form>
			</CardContent>
		</Card>
	);
}

function HealthSection({
	config,
}: {
	config: ProviderConfig;
}) {
	const testMutation = useTestSavedProviderConfig();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Health</CardTitle>
				<CardDescription>Connection status.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center gap-2">
					<span className={cn("h-2.5 w-2.5 rounded-full", statusDotClass(config.status))} />
					<span className="font-medium">{statusLabel(config.status)}</span>
					{config.latencyMs !== undefined && (
						<span className="text-sm text-muted-foreground">{config.latencyMs}ms</span>
					)}
					{config.lastCheckedAt !== undefined && (
						<span className="text-sm text-muted-foreground">
							· checked {formatRelativeTime(config.lastCheckedAt)}
						</span>
					)}
				</div>
				{config.statusMessage && config.status !== "healthy" && (
					<p className="text-sm text-destructive">{config.statusMessage}</p>
				)}
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={testMutation.isPending}
						onClick={() => testMutation.mutate(config.id)}
					>
						{testMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Plug className="h-4 w-4" />
						)}
						Test connection
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function ModelsSection({
	config,
}: {
	config: ProviderConfig;
}) {
	const { data: modelsData, isLoading } = useProviderModels(config.id);
	const updateModels = useUpdateProviderModels(config.id);
	const updateConfig = useUpdateProviderConfig();
	const addModel = useAddProviderModel(config.id);
	const deleteModel = useDeleteProviderModel(config.id);
	const [search, setSearch] = useState("");
	const [newModelId, setNewModelId] = useState("");

	const models = modelsData?.models ?? [];
	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return models;
		return models.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
	}, [models, search]);

	const enabledCount = models.filter((m) => m.enabled).length;

	function toggle(id: string, enabled: boolean) {
		updateModels.mutate({ models: [{ id, enabled: !enabled }] });
	}

	function setDefault(modelId: string) {
		updateConfig.mutate({ id: config.id, defaultModel: modelId });
	}

	function handleAddModel() {
		const id = newModelId.trim();
		if (!id) return;
		addModel.mutate({ modelId: id }, { onSuccess: () => setNewModelId("") });
	}

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between">
				<div>
					<CardTitle>Models</CardTitle>
					<CardDescription>
						{models.length} total · {enabledCount} enabled
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex gap-2">
					<Input
						placeholder="Model ID (e.g. gpt-4o-mini)"
						value={newModelId}
						onChange={(e) => setNewModelId(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleAddModel();
							}
						}}
					/>
					<Button
						size="sm"
						variant="outline"
						className="shrink-0"
						disabled={!newModelId.trim() || addModel.isPending}
						onClick={handleAddModel}
					>
						{addModel.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Plus className="h-4 w-4" />
						)}
						Add
					</Button>
				</div>
				{addModel.isError && <p className="text-xs text-destructive">{addModel.error?.message}</p>}
				{models.length > 0 && (
					<Input
						placeholder="Search models"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				)}
				{isLoading ? (
					<p className="py-6 text-center text-sm text-muted-foreground">Loading models…</p>
				) : filtered.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{models.length === 0
							? "No models yet. Add a model above to get started."
							: "No matches found."}
					</p>
				) : (
					<div className="max-h-80 space-y-0.5 overflow-y-auto rounded-lg border p-1">
						{filtered.map((m) => {
							const isDefault = config.defaultModel === m.id;
							return (
								<div
									key={m.id}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50"
								>
									<button
										type="button"
										onClick={() => toggle(m.id, m.enabled)}
										className={cn(
											"flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
											m.enabled ? "bg-primary" : "bg-muted",
										)}
										aria-label={m.enabled ? "Disable model" : "Enable model"}
									>
										<span
											className={cn(
												"h-3 w-3 rounded-full bg-background transition-transform",
												m.enabled && "translate-x-3",
											)}
										/>
									</button>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">{m.name}</p>
										<p className="truncate text-xs text-muted-foreground">{m.id}</p>
									</div>
									{isDefault && (
										<Badge variant="secondary" className="shrink-0 gap-1">
											<Star className="h-3 w-3" />
											Default
										</Badge>
									)}
									{m.enabled && !isDefault && (
										<Button
											variant="ghost"
											size="sm"
											className="shrink-0 text-xs"
											onClick={() => setDefault(m.id)}
										>
											Set default
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
										disabled={deleteModel.isPending}
										onClick={() => deleteModel.mutate(m.id)}
										aria-label="Remove model"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function MetadataSection({
	config,
}: {
	config: ProviderConfig;
}) {
	const rows: Array<{ label: string; value: string }> = [
		{ label: "Provider ID", value: config.id },
		{ label: "Type", value: PROVIDER_META[config.type].label },
		{ label: "Configured", value: config.isConfigured ? "Yes" : "No key" },
		{ label: "Created", value: new Date(config.createdAt).toLocaleString() },
		{ label: "Updated", value: new Date(config.updatedAt).toLocaleString() },
	];
	if (config.lastCheckedAt !== undefined) {
		rows.splice(3, 0, {
			label: "Last checked",
			value: new Date(config.lastCheckedAt).toLocaleString(),
		});
	}
	if (config.latencyMs !== undefined) {
		rows.splice(4, 0, { label: "Latency", value: `${config.latencyMs}ms` });
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Metadata</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="divide-y">
					{rows.map((row) => (
						<div key={row.label} className="flex items-center justify-between py-2 text-sm">
							<dt className="text-muted-foreground">{row.label}</dt>
							<dd className="ml-4 truncate font-medium">{row.value}</dd>
						</div>
					))}
				</dl>
			</CardContent>
		</Card>
	);
}

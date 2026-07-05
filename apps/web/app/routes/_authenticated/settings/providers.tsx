import type {
	ProviderConfig,
	ProviderConfigInput,
	ProviderConfigUpdate,
	ProviderStatus,
	ProviderType,
} from "@katto/sdk";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Check,
	Eye,
	EyeOff,
	Loader2,
	Pencil,
	Plug,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ClientOnly } from "~/components/client-only";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/cn";
import {
	useCreateProviderConfig,
	useDeleteProviderConfig,
	useProviderConfigs,
	useTestProviderConfig,
	useTestSavedProviderConfig,
	useUpdateProviderConfig,
} from "~/lib/queries/provider-configs";

export const Route = createFileRoute("/_authenticated/settings/providers")({
	component: ProvidersSettingsPage,
});

/** Per-type UI metadata and chat endpoint path (the API appends this in Slice 5). */
const PROVIDER_META: Record<
	ProviderType,
	{ label: string; placeholder: string; chatPath: string }
> = {
	openai: {
		label: "OpenAI",
		placeholder: "https://api.openai.com/v1",
		chatPath: "chat/completions",
	},
	anthropic: {
		label: "Anthropic",
		placeholder: "https://api.anthropic.com/v1",
		chatPath: "messages",
	},
	custom: {
		label: "Custom",
		placeholder: "https://your-provider.com/v1",
		chatPath: "chat/completions",
	},
};

function statusLabel(status: ProviderStatus | undefined): string {
	switch (status) {
		case "healthy":
			return "Connected";
		case "degraded":
			return "Degraded";
		case "unhealthy":
			return "Error";
		default:
			return "Not tested";
	}
}

function statusDotClass(status: ProviderStatus | undefined): string {
	switch (status) {
		case "healthy":
			return "bg-emerald-500";
		case "degraded":
			return "bg-amber-500";
		case "unhealthy":
			return "bg-red-500";
		default:
			return "bg-muted-foreground/40";
	}
}

function formatRelativeTime(ts: number): string {
	const diff = Date.now() - ts;
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function ProvidersSettingsPage() {
	return (
		<ClientOnly
			fallback={
				<Card>
					<CardHeader>
						<CardTitle>Providers</CardTitle>
						<CardDescription>
							Connect OpenAI-compatible providers to start chatting.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</div>
					</CardContent>
				</Card>
			}
		>
			<ProvidersContent />
		</ClientOnly>
	);
}

function ProvidersContent() {
	const query = useProviderConfigs();
	const deleteMutation = useDeleteProviderConfig();
	const testSavedMutation = useTestSavedProviderConfig();
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ProviderConfig | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [testingId, setTestingId] = useState<string | null>(null);

	const openAdd = () => {
		setEditing(null);
		setFormOpen(true);
	};
	const openEdit = (config: ProviderConfig) => {
		setEditing(config);
		setFormOpen(true);
	};
	const closeForm = () => {
		setFormOpen(false);
		setEditing(null);
	};
	const handleTest = (id: string) => {
		setTestingId(id);
		testSavedMutation.mutate(id, { onSettled: () => setTestingId(null) });
	};

	const configs = query.data?.providerConfigs ?? [];

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between">
				<div>
					<CardTitle>Providers</CardTitle>
					<CardDescription>Connect OpenAI-compatible providers to start chatting.</CardDescription>
				</div>
				{!formOpen && (
					<Button size="sm" onClick={openAdd}>
						<Plus className="h-4 w-4" />
						Add provider
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{formOpen && <ProviderConfigForm editing={editing} onDone={closeForm} />}

				{query.isLoading && (
					<div className="space-y-3">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				)}

				{query.isError && (
					<div className="flex items-center gap-2 rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span>Failed to load providers: {query.error?.message}</span>
					</div>
				)}

				{!query.isLoading && !query.isError && configs.length === 0 && !formOpen && (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="font-medium">No providers yet</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Add your first provider to start chatting.
						</p>
					</div>
				)}

				<div className="space-y-3">
					{configs.map((config) => {
						const isConfirming = confirmDelete === config.id;
						const isTesting = testingId === config.id;
						return (
							<div key={config.id} className="rounded-lg border p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span
												className={cn(
													"h-2 w-2 shrink-0 rounded-full",
													statusDotClass(config.status),
												)}
												title={statusLabel(config.status)}
											/>
											<p className="truncate font-medium">{config.name}</p>
											<Badge variant="secondary">{PROVIDER_META[config.type].label}</Badge>
										</div>
										<p className="mt-1 truncate text-sm text-muted-foreground">{config.baseUrl}</p>
										<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
											<span>{statusLabel(config.status)}</span>
											{config.latencyMs !== undefined && config.lastCheckedAt !== undefined && (
												<span>
													{config.latencyMs}ms · {formatRelativeTime(config.lastCheckedAt)}
												</span>
											)}
											{config.defaultModel && <span>Default: {config.defaultModel}</span>}
										</div>
										{config.statusMessage && config.status !== "healthy" && (
											<p className="mt-1 truncate text-xs text-destructive">
												{config.statusMessage}
											</p>
										)}
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{isConfirming ? (
											<>
												<Button
													size="sm"
													variant="destructive"
													disabled={deleteMutation.isPending}
													onClick={() => {
														deleteMutation.mutate(config.id, {
															onSuccess: () => setConfirmDelete(null),
														});
													}}
												>
													{deleteMutation.isPending ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Check className="h-4 w-4" />
													)}
													Confirm
												</Button>
												<Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
													Cancel
												</Button>
											</>
										) : (
											<>
												<Button
													size="sm"
													variant="outline"
													disabled={isTesting}
													onClick={() => handleTest(config.id)}
												>
													{isTesting ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Plug className="h-4 w-4" />
													)}
													Test
												</Button>
												<Button size="sm" variant="outline" onClick={() => openEdit(config)}>
													<Pencil className="h-4 w-4" />
													Edit
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => setConfirmDelete(config.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
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

function ProviderConfigForm({
	editing,
	onDone,
}: {
	editing: ProviderConfig | null;
	onDone: () => void;
}) {
	const createMutation = useCreateProviderConfig();
	const updateMutation = useUpdateProviderConfig();
	const testMutation = useTestProviderConfig();
	const [showToken, setShowToken] = useState(false);

	const form = useForm({
		defaultValues: {
			name: editing?.name ?? "",
			type: editing?.type ?? "openai",
			baseUrl: editing?.baseUrl ?? "",
			apiToken: "",
			defaultModel: editing?.defaultModel ?? "",
		},
		onSubmit: async ({ value }) => {
			try {
				if (editing) {
					const update: ProviderConfigUpdate & { id: string } = {
						id: editing.id,
						name: value.name,
						type: value.type,
						baseUrl: value.baseUrl,
						defaultModel: value.defaultModel,
					};
					if (value.apiToken) {
						update.apiToken = value.apiToken;
					}
					await updateMutation.mutateAsync(update);
				} else {
					const input: ProviderConfigInput = {
						name: value.name,
						type: value.type,
						baseUrl: value.baseUrl,
						apiToken: value.apiToken,
						defaultModel: value.defaultModel,
					};
					await createMutation.mutateAsync(input);
				}
				onDone();
			} catch {
				// Errors are surfaced via mutation state below.
			}
		},
	});

	const submitting = createMutation.isPending || updateMutation.isPending;
	const submitError = (createMutation.error ?? updateMutation.error)?.message ?? null;

	return (
		<div className="space-y-4 rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium">{editing ? "Edit provider" : "Add provider"}</h3>
				<Button variant="ghost" size="icon" onClick={onDone}>
					<X className="h-4 w-4" />
				</Button>
			</div>

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
										Base URL
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
								API Token
							</label>
							<div className="relative">
								<Input
									id="pc-token"
									type={showToken ? "text" : "password"}
									placeholder={editing ? "Leave blank to keep current" : "sk-..."}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									className="pr-9"
								/>
								<button
									type="button"
									onClick={() => setShowToken((v) => !v)}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									aria-label={showToken ? "Hide token" : "Show token"}
								>
									{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
							<p className="text-xs text-muted-foreground">
								Leave empty for tokenless providers (e.g. local Ollama).
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

				<div className="flex flex-wrap items-center gap-2">
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
										apiToken: values.apiToken,
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

					<form.Subscribe selector={(s) => s.canSubmit}>
						{(canSubmit) => (
							<Button type="submit" size="sm" disabled={!canSubmit || submitting}>
								{submitting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Check className="h-4 w-4" />
								)}
								{editing ? "Save changes" : "Add provider"}
							</Button>
						)}
					</form.Subscribe>
				</div>

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

				{testMutation.isError && (
					<p className="text-xs text-destructive">Test failed: {testMutation.error?.message}</p>
				)}

				{submitError && <p className="text-xs text-destructive">{submitError}</p>}
			</form>
		</div>
	);
}

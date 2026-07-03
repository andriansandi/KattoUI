import type { ProviderConfig, ProviderConfigInput, ProviderConfigUpdate } from "@katto/sdk";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Check, Loader2, Pencil, Plug, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
	useCreateProviderConfig,
	useDeleteProviderConfig,
	useProviderConfigs,
	useTestProviderConfig,
	useUpdateProviderConfig,
} from "~/lib/queries/provider-configs";

export const Route = createFileRoute("/_authenticated/settings/providers")({
	component: ProvidersSettingsPage,
});

function ProvidersSettingsPage() {
	const query = useProviderConfigs();
	const deleteMutation = useDeleteProviderConfig();
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ProviderConfig | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
						return (
							<div
								key={config.id}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<p className="truncate font-medium">{config.name}</p>
										<Badge variant={config.isConfigured ? "default" : "outline"}>
											{config.isConfigured ? "Configured" : "No token"}
										</Badge>
									</div>
									<p className="truncate text-sm text-muted-foreground">{config.baseUrl}</p>
									{config.defaultModel && (
										<p className="text-xs text-muted-foreground">Model: {config.defaultModel}</p>
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
											<Button size="sm" variant="outline" onClick={() => openEdit(config)}>
												<Pencil className="h-4 w-4" />
												Edit
											</Button>
											<Button size="sm" variant="ghost" onClick={() => setConfirmDelete(config.id)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</>
									)}
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

	const form = useForm({
		defaultValues: {
			name: editing?.name ?? "",
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
								placeholder="https://api.openai.com/v1"
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

				<form.Field name="apiToken" validators={{ onChange: z.string().max(1000) }}>
					{(field) => (
						<div className="space-y-2">
							<label htmlFor="pc-token" className="block text-sm font-medium">
								API Token
							</label>
							<Input
								id="pc-token"
								type="password"
								placeholder={editing ? "Leave blank to keep current" : "sk-..."}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
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
							<div className="flex items-center gap-2">
								<Check className="h-4 w-4 text-emerald-600" />
								<span className="font-medium">Connected successfully</span>
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

import type { ProviderType } from "@katto/sdk";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, Loader2, Pencil, Plug, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ClientOnly } from "~/components/client-only";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/cn";
import { formatRelativeTime, statusDotClass, statusLabel } from "~/lib/provider-status";
import {
	useDeleteProviderConfig,
	useProviderConfigs,
	useTestSavedProviderConfig,
} from "~/lib/queries/provider-configs";

export const Route = createFileRoute("/_authenticated/settings/providers/")({
	component: ProvidersSettingsPage,
});

/** Per-type UI metadata and chat endpoint path (the API appends this). */
export const PROVIDER_META: Record<
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
	const navigate = useNavigate();
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [testingId, setTestingId] = useState<string | null>(null);

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
				<Button
					size="sm"
					onClick={() => navigate({ to: "/settings/providers/$id", params: { id: "new" } })}
				>
					<Plus className="h-4 w-4" />
					Add provider
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
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

				{!query.isLoading && !query.isError && configs.length === 0 && (
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
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														navigate({
															to: "/settings/providers/$id",
															params: { id: config.id },
														})
													}
												>
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

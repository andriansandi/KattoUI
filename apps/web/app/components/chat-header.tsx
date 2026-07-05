import { Menu, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Dropdown } from "~/components/ui/dropdown";
import { useUpdateConversation } from "~/lib/queries/conversations";
import { useProviderConfigs, useProviderModels } from "~/lib/queries/provider-configs";

interface ChatHeaderProps {
	title: string;
	model?: string | undefined;
	providerConfigId?: string | undefined;
	conversationId: string;
	onToggleMobileSidebar: () => void;
}

export function ChatHeader({
	title,
	model,
	providerConfigId,
	conversationId,
	onToggleMobileSidebar,
}: ChatHeaderProps) {
	const { data: configsData } = useProviderConfigs();
	const configs = configsData?.providerConfigs ?? [];
	const { data: modelsData } = useProviderModels(providerConfigId);
	const updateConversation = useUpdateConversation();

	const configOptions =
		configs.length > 0 ? configs.map((c) => ({ value: c.id, label: c.name })) : [];

	const modelOptions = modelsData?.models?.map((m) => ({ value: m, label: m })) ?? [];
	const defaultModelOption =
		model !== undefined && !modelOptions.some((o) => o.value === model)
			? [{ value: model, label: model }]
			: [];
	const allModelOptions = [...defaultModelOption, ...modelOptions];

	return (
		<div className="flex h-14 flex-shrink-0 items-center gap-2 border-b px-4">
			<Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileSidebar}>
				<Menu className="h-5 w-5" />
				<span className="sr-only">Toggle sidebar</span>
			</Button>
			<h1 className="flex-1 truncate text-sm font-semibold">{title}</h1>
			{configs.length > 0 ? (
				<>
					<Dropdown
						value={providerConfigId}
						options={configOptions}
						placeholder="Provider"
						onChange={(value) =>
							updateConversation.mutate({ id: conversationId, providerConfigId: value })
						}
					/>
					<Dropdown
						value={model}
						options={allModelOptions}
						placeholder="Model"
						onChange={(value) => updateConversation.mutate({ id: conversationId, model: value })}
					/>
				</>
			) : (
				<span className="text-xs font-medium text-muted-foreground">No provider</span>
			)}
			<Button variant="ghost" size="icon" aria-label="More">
				<MoreHorizontal className="h-4 w-4" />
			</Button>
		</div>
	);
}

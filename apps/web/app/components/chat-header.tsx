import { Menu, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Dropdown } from "~/components/ui/dropdown";
import type { DropdownGroup } from "~/components/ui/dropdown";
import { useUpdateConversation } from "~/lib/queries/conversations";
import { useAllEnabledModels } from "~/lib/queries/provider-configs";

interface ChatHeaderProps {
	title: string;
	model?: string | undefined;
	providerConfigId?: string | undefined;
	conversationId: string;
	onToggleMobileSidebar: () => void;
}

/** Composite key encoding (providerConfigId, modelId) — config ids are UUIDs. */
function compositeKey(providerConfigId: string, model: string): string {
	return `${providerConfigId}:${model}`;
}

function splitComposite(value: string): { providerConfigId: string; model: string } {
	const sep = value.indexOf(":");
	return { providerConfigId: value.slice(0, sep), model: value.slice(sep + 1) };
}

export function ChatHeader({
	title,
	model,
	providerConfigId,
	conversationId,
	onToggleMobileSidebar,
}: ChatHeaderProps) {
	const { data: allModels } = useAllEnabledModels();
	const updateConversation = useUpdateConversation();

	const groups: DropdownGroup[] = (allModels?.groups ?? []).map((g) => ({
		label: g.providerName,
		options: g.models.map((m) => ({
			value: compositeKey(g.providerConfigId, m.id),
			label: m.name,
		})),
	}));

	const currentValue =
		providerConfigId !== undefined && model !== undefined
			? compositeKey(providerConfigId, model)
			: undefined;

	// If the saved model is not in any group (disabled, or catalog not synced),
	// surface it as a fallback so the selector still shows something.
	const hasCurrent = groups.some((g) => g.options.some((o) => o.value === currentValue));
	if (!hasCurrent && currentValue !== undefined && model !== undefined) {
		groups.unshift({
			label: "Current",
			options: [{ value: currentValue, label: model }],
		});
	}

	function handleChange(value: string) {
		const { providerConfigId: newConfigId, model: newModel } = splitComposite(value);
		updateConversation.mutate({
			id: conversationId,
			providerConfigId: newConfigId,
			model: newModel,
		});
	}

	return (
		<div className="flex h-14 flex-shrink-0 items-center gap-2 border-b px-4">
			<Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileSidebar}>
				<Menu className="h-5 w-5" />
				<span className="sr-only">Toggle sidebar</span>
			</Button>
			<h1 className="flex-1 truncate text-sm font-semibold">{title}</h1>
			{groups.length > 0 ? (
				<Dropdown
					value={currentValue}
					groups={groups}
					placeholder="Model"
					onChange={handleChange}
				/>
			) : (
				<span className="text-xs font-medium text-muted-foreground">No model</span>
			)}
			<Button variant="ghost" size="icon" aria-label="More">
				<MoreHorizontal className="h-4 w-4" />
			</Button>
		</div>
	);
}

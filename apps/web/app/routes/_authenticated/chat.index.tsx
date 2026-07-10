import type { ConversationInput } from "@katto/sdk";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brain, Menu, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatComposer } from "~/components/chat-composer";
import { Button } from "~/components/ui/button";
import { Dropdown } from "~/components/ui/dropdown";
import type { DropdownGroup } from "~/components/ui/dropdown";
import { useConversations, useCreateConversation } from "~/lib/queries/conversations";
import { useAllEnabledModels, useProviderConfigs } from "~/lib/queries/provider-configs";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/chat/")({
	component: ChatEmptyState,
});

function compositeKey(providerConfigId: string, model: string): string {
	return `${providerConfigId}:${model}`;
}

function splitComposite(value: string): { providerConfigId: string; model: string } {
	const sep = value.indexOf(":");
	return { providerConfigId: value.slice(0, sep), model: value.slice(sep + 1) };
}

function ChatEmptyState() {
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
	const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
	const navigate = useNavigate();
	const createConversation = useCreateConversation();
	const { data: allModels } = useAllEnabledModels();
	const { data: configsData } = useProviderConfigs();
	const { data: convData } = useConversations();

	const [input, setInput] = useState("");
	const [isStarting, setIsStarting] = useState(false);
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const setPendingMessage = useUIStore((s) => s.setPendingMessage);

	// Default to the model from the most recently used conversation; fall back
	// to the most-recent provider config's default model. This way new chats
	// inherit the last model the user actually chose, not just a config default.
	useEffect(() => {
		if (selected !== undefined) return;
		const convs = convData?.conversations ?? [];
		if (convs.length > 0) {
			const last = convs[0];
			if (last?.model && last?.providerConfigId) {
				setSelected(compositeKey(last.providerConfigId, last.model));
				return;
			}
		}
		const configs = configsData?.providerConfigs ?? [];
		if (configs.length === 0) return;
		const recent = [...configs].sort((a, b) => b.createdAt - a.createdAt)[0];
		if (recent?.defaultModel) {
			setSelected(compositeKey(recent.id, recent.defaultModel));
		}
	}, [convData, configsData, selected]);

	const groups: DropdownGroup[] = (allModels?.groups ?? []).map((g) => ({
		label: g.providerName,
		options: g.models.map((m) => ({
			value: compositeKey(g.providerConfigId, m.id),
			label: m.name,
			icon: m.reasoning ? Brain : undefined,
		})),
	}));

	async function handleSend() {
		if (!input.trim() || isStarting) return;
		const content = input.trim();
		setInput("");
		setIsStarting(true);

		try {
			const convInput: ConversationInput = {};
			if (selected !== undefined) {
				const { providerConfigId, model } = splitComposite(selected);
				convInput.providerConfigId = providerConfigId;
				convInput.model = model;
			}
			const conversation = await createConversation.mutateAsync(convInput);
			setPendingMessage({ conversationId: conversation.id, content });
			navigate({
				to: "/chat/$conversationId",
				params: { conversationId: conversation.id },
			});
			setMobileSidebarOpen(false);
		} catch {
			setInput(content);
		} finally {
			setIsStarting(false);
		}
	}

	return (
		<div className="relative flex min-h-0 w-full flex-1 flex-col">
			<Button
				variant="ghost"
				size="icon"
				className="absolute left-4 top-4 md:hidden"
				onClick={toggleMobileSidebar}
			>
				<Menu className="h-5 w-5" />
				<span className="sr-only">Toggle sidebar</span>
			</Button>
			<div className="flex flex-1 flex-col items-center justify-center text-center">
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
					<PawPrint className="h-6 w-6" />
				</div>
				<h2 className="text-xl font-semibold">Meow! Ready to build something?</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Pick a model and send your first message.
				</p>
				{groups.length > 0 && (
					<div className="mt-4">
						<Dropdown value={selected} groups={groups} placeholder="Model" onChange={setSelected} />
					</div>
				)}
			</div>
			<div className="flex-shrink-0 px-4 pb-4 pt-2">
				<ChatComposer value={input} onChange={setInput} onSend={handleSend} disabled={isStarting} />
			</div>
		</div>
	);
}

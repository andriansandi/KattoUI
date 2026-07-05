import type { ConversationInput } from "@katto/sdk";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Menu, PawPrint } from "lucide-react";
import { useState } from "react";
import { ChatComposer } from "~/components/chat-composer";
import { Button } from "~/components/ui/button";
import { Dropdown } from "~/components/ui/dropdown";
import { useCreateConversation } from "~/lib/queries/conversations";
import { useProviderConfigs, useProviderModels } from "~/lib/queries/provider-configs";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/chat/")({
	component: ChatEmptyState,
});

function ChatEmptyState() {
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
	const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
	const navigate = useNavigate();
	const createConversation = useCreateConversation();
	const { data: configsData } = useProviderConfigs();
	const configs = configsData?.providerConfigs ?? [];

	const [input, setInput] = useState("");
	const [isStarting, setIsStarting] = useState(false);
	const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(configs[0]?.id);
	const { data: modelsData } = useProviderModels(selectedConfigId);
	const modelOptions = modelsData?.models?.map((m) => ({ value: m, label: m })) ?? [];
	const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

	const configOptions = configs.map((c) => ({ value: c.id, label: c.name }));

	const setPendingMessage = useUIStore((s) => s.setPendingMessage);

	async function handleSend() {
		if (!input.trim() || isStarting) return;
		const content = input.trim();
		setInput("");
		setIsStarting(true);

		try {
			const convInput: ConversationInput = {};
			if (selectedConfigId !== undefined) convInput.providerConfigId = selectedConfigId;
			if (selectedModel !== undefined) convInput.model = selectedModel;
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
		<div className="relative flex h-full w-full flex-col">
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
				{configs.length > 0 && (
					<div className="mt-4 flex items-center gap-2">
						<Dropdown
							value={selectedConfigId}
							options={configOptions}
							placeholder="Provider"
							onChange={(v) => {
								setSelectedConfigId(v);
								setSelectedModel(undefined);
							}}
						/>
						<Dropdown
							value={selectedModel}
							options={modelOptions}
							placeholder="Model"
							onChange={setSelectedModel}
						/>
					</div>
				)}
			</div>
			<div className="px-4 pb-4 pt-2">
				<ChatComposer value={input} onChange={setInput} onSend={handleSend} disabled={isStarting} />
			</div>
		</div>
	);
}

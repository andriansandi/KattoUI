import { createFileRoute } from "@tanstack/react-router";
import { Menu, PawPrint } from "lucide-react";
import { useState } from "react";
import { ChatComposer } from "~/components/chat-composer";
import { Button } from "~/components/ui/button";
import { useUIStore } from "~/stores/ui-store";

export const Route = createFileRoute("/_authenticated/chat/")({
	component: ChatEmptyState,
});

function ChatEmptyState() {
	const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
	const [input, setInput] = useState("");

	function handleSend() {
		setInput("");
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
			</div>
			<div className="px-4 pb-4 pt-2">
				<ChatComposer value={input} onChange={setInput} onSend={handleSend} />
			</div>
		</div>
	);
}

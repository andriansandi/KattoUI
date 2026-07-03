import { createFileRoute } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
	component: ChatEmptyState,
});

function ChatEmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center text-center">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
				<PawPrint className="h-6 w-6" />
			</div>
			<h2 className="text-xl font-semibold">Meow! Ready to build something?</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				Pick a model and send your first message.
			</p>
		</div>
	);
}

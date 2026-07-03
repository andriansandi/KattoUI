import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ConversationSidebar } from "~/components/conversation-sidebar";

export const Route = createFileRoute("/_authenticated/chat")({
	component: ChatLayout,
});

function ChatLayout() {
	return (
		<div className="-m-6 flex h-[calc(100vh-3.5rem)]">
			<ConversationSidebar />
			<div className="flex-1 overflow-hidden">
				<Outlet />
			</div>
		</div>
	);
}

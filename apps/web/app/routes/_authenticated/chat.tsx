import { Link, createFileRoute } from "@tanstack/react-router";
import { MessageSquarePlus, PawPrint, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/_authenticated/chat")({
	component: ChatLayout,
});

const conversations = [
	{ id: "1", title: "Cloudflare Workers overview", updatedAt: "2h ago" },
	{ id: "2", title: "Tailwind v4 migration", updatedAt: "5h ago" },
	{ id: "3", title: "Plugin SDK design", updatedAt: "1d ago" },
];

function ChatLayout() {
	return (
		<div className="h-full pr-60">
			<div className="fixed inset-y-0 right-0 top-14 w-60 border-l bg-card p-4">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold">Chats</h2>
					<Button variant="ghost" size="icon" asChild>
						<Link to="/chat">
							<MessageSquarePlus className="h-4 w-4" />
							<span className="sr-only">New chat</span>
						</Link>
					</Button>
				</div>
				<div className="relative mb-4">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search chats" className="pl-9" />
				</div>
				<div className="space-y-1">
					{conversations.map((c) => (
						<Link
							key={c.id}
							to="/chat/$conversationId"
							params={{ conversationId: c.id }}
							className="block rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
						>
							<p className="truncate font-medium">{c.title}</p>
							<p className="text-xs text-muted-foreground">{c.updatedAt}</p>
						</Link>
					))}
				</div>
			</div>
			<div className="flex h-full flex-col items-center justify-center text-center">
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
					<PawPrint className="h-6 w-6" />
				</div>
				<h2 className="text-xl font-semibold">Meow! Ready to build something?</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Pick a model and send your first message.
				</p>
			</div>
		</div>
	);
}

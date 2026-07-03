import { Bot, Send, Sparkles, User } from "lucide-react";
import { KattoLogo } from "~/components/logo";

export function HeroMockup() {
	return (
		<div className="relative mx-auto w-full max-w-4xl">
			<div className="animate-float">
				<div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
					{/* Browser chrome */}
					<div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
						<div className="h-3 w-3 rounded-full bg-red-400" />
						<div className="h-3 w-3 rounded-full bg-amber-400" />
						<div className="h-3 w-3 rounded-full bg-green-400" />
						<div className="ml-4 flex-1 rounded-md bg-background px-3 py-1 text-center text-[10px] text-muted-foreground">
							katto.xyz/chat
						</div>
					</div>

					<div className="flex">
						{/* Sidebar */}
						<aside className="hidden w-44 border-r bg-card p-3 sm:block">
							<div className="mb-4 flex items-center gap-2">
								<KattoLogo className="h-5 w-5 text-primary" />
								<span className="text-xs font-semibold">KattoUI</span>
							</div>
							<div className="space-y-1">
								<div className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
									Chat
								</div>
								<div className="px-3 py-2 text-[10px] text-muted-foreground">
									Cloudflare Workers overview
								</div>
								<div className="px-3 py-2 text-[10px] text-muted-foreground">Plugin SDK design</div>
							</div>
						</aside>

						{/* Main chat area */}
						<main className="flex-1 bg-background p-3 sm:p-4">
							{/* Header */}
							<div className="mb-4 flex items-center justify-between sm:mb-6">
								<div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
									<Bot className="h-3.5 w-3.5 text-primary" />
									<span className="text-[11px] font-medium">GPT-4o</span>
									<span className="text-[10px] text-muted-foreground">OpenAI</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="relative flex h-2 w-2">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
										<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
									</span>
									<span className="hidden text-[10px] text-muted-foreground sm:inline">
										Streaming
									</span>
								</div>
							</div>

							{/* Messages */}
							<div className="space-y-4 sm:space-y-5">
								{/* User message */}
								<div className="flex justify-end gap-2">
									<div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[11px] text-primary-foreground shadow-sm sm:px-4 sm:py-2.5 sm:text-xs">
										Build a Cloudflare Worker that streams an LLM response.
									</div>
									<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted sm:h-7 sm:w-7">
										<User className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
									</div>
								</div>

								{/* Assistant message — ChatGPT/Claude style */}
								<div className="flex justify-start gap-2">
									<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-7 sm:w-7">
										<Sparkles className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
									</div>
									<div className="max-w-[92%] space-y-2">
										<div className="flex items-center gap-1.5">
											<span className="text-[11px] font-medium">Katto</span>
											<span className="text-[10px] text-muted-foreground">Assistant</span>
										</div>
										<div className="space-y-3 rounded-2xl rounded-tl-sm border bg-card p-3 shadow-sm sm:p-4">
											<p className="text-[10px] leading-relaxed text-foreground sm:text-[11px]">
												Here&apos;s a streaming Worker example for the OpenAI API:
											</p>
											<pre className="overflow-x-auto rounded-lg bg-muted p-2 text-[8px] leading-tight text-foreground sm:p-3 sm:text-[9px]">
												<code>
													{`export default {
  async fetch(request) {
    const res = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', stream: true }),
      }
    );
    return new Response(res.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  },
};`}
												</code>
											</pre>

											{/* Streaming cursor */}
											<div className="flex items-center gap-1 pt-1">
												<span className="inline-block h-4 w-0.5 animate-pulse rounded-full bg-primary" />
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Input */}
							<div className="mt-4 flex items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-sm sm:mt-6">
								<div className="flex-1 text-[10px] text-muted-foreground sm:text-xs">
									Ask anything...
								</div>
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-7 sm:w-7">
									<Send className="h-3 w-3" />
								</div>
							</div>
						</main>
					</div>
				</div>
			</div>

			{/* Subtle glow */}
			<div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-primary/5 blur-3xl" />
		</div>
	);
}

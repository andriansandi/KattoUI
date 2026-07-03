import { Link, createFileRoute } from "@tanstack/react-router";
import {
	Bolt,
	Box,
	Cloud,
	Command,
	Globe,
	Layers,
	Lock,
	Palette,
	Rocket,
	Sparkles,
	Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { HeroMockup } from "~/components/hero-mockup";
import { KattoLogo } from "~/components/logo";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [{ title: "KattoUI — The purr-fect interface for every LLM. 🐈" }],
	}),
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
					<div className="flex items-center gap-2 font-semibold">
						<KattoLogo className="h-5 w-5 text-primary" />
						<span>KattoUI</span>
					</div>
					<nav className="hidden items-center gap-6 text-sm font-medium md:flex">
						<a href="#features" className="text-muted-foreground hover:text-foreground">
							Features
						</a>
						<a href="#cloudflare" className="text-muted-foreground hover:text-foreground">
							Cloudflare Native
						</a>
						<a href="#open-source" className="text-muted-foreground hover:text-foreground">
							Open Source
						</a>
					</nav>
					<div className="flex items-center gap-2">
						<Button variant="ghost" asChild>
							<Link to="/sign-in">Sign In</Link>
						</Button>
						<Button asChild>
							<Link to="/chat">Get Started</Link>
						</Button>
					</div>
				</div>
			</header>

			<motion.section
				initial={{ opacity: 0, y: 24 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
				className="mx-auto max-w-7xl px-4 pb-16 pt-12 text-center md:pt-16"
			>
				<motion.h1
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
					className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
				>
					The <span className="italic text-primary">purr-fect</span> interface
					<br />
					<span className="text-primary">for every LLM. 🐈</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
					className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg"
				>
					Private AI chat workspace built for developers on Cloudflare.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
					className="mt-6 flex justify-center gap-3"
				>
					<Button size="lg" asChild>
						<Link to="/chat">Get Started</Link>
					</Button>
					<Button size="lg" variant="outline" asChild>
						<a href="https://github.com" target="_blank" rel="noreferrer">
							View on GitHub
						</a>
					</Button>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 32, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
					className="mt-10 md:mt-12"
				>
					<HeroMockup />
				</motion.div>
			</motion.section>

			<section id="features" className="mx-auto max-w-7xl px-4 py-20">
				<div className="grid gap-6 md:grid-cols-3">
					<FeatureCard
						icon={<Cloud className="h-5 w-5" />}
						title="Cloudflare Native"
						description="Designed for Workers, D1, KV, R2, Durable Objects, and AI Gateway from day one."
					/>
					<FeatureCard
						icon={<Layers className="h-5 w-5" />}
						title="Multi Provider"
						description="Plug in OpenAI, Anthropic, Gemini, OpenRouter, Cloudflare AI, Ollama, and more."
					/>
					<FeatureCard
						icon={<Palette className="h-5 w-5" />}
						title="Theme Engine"
						description="Installable themes that change appearance, never layout. Switch at runtime."
					/>
					<FeatureCard
						icon={<Bolt className="h-5 w-5" />}
						title="Plugin System"
						description="Register pages, commands, providers, themes, and settings without touching core."
					/>
					<FeatureCard
						icon={<Command className="h-5 w-5" />}
						title="Keyboard First"
						description="Command palette, customizable shortcuts, and a Raycast-inspired workflow."
					/>
					<FeatureCard
						icon={<Lock className="h-5 w-5" />}
						title="Enterprise Security"
						description="CSP-safe, Clerk auth, rate limiting, and plugin sandboxing by design."
					/>
				</div>
			</section>

			<section id="cloudflare" className="border-y bg-muted/50 py-20">
				<div className="mx-auto max-w-7xl px-4">
					<div className="grid items-center gap-12 md:grid-cols-2">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Runs where your data lives.</h2>
							<p className="mt-4 text-muted-foreground">
								KattoUI separates the frontend and API cleanly. The API is a Cloudflare Worker built
								with Hono, ready for D1, KV, R2, Queues, and AI Gateway. Deploy globally in seconds.
							</p>
						</div>
						<div className="rounded-xl border bg-card p-8 shadow-sm">
							<div className="space-y-4">
								<StackItem icon={<Box className="h-4 w-4" />} label="Workers" />
								<StackItem icon={<Globe className="h-4 w-4" />} label="AI Gateway" />
								<StackItem icon={<Sparkles className="h-4 w-4" />} label="Vectorize" />
								<StackItem icon={<Rocket className="h-4 w-4" />} label="Durable Objects" />
								<StackItem icon={<Zap className="h-4 w-4" />} label="Queues" />
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="open-source" className="mx-auto max-w-7xl px-4 py-20 text-center">
				<h2 className="text-3xl font-bold tracking-tight">Built in the open.</h2>
				<p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
					KattoUI is open source under the MIT license. Contributions, plugins, and themes are
					welcome.
				</p>
				<Button className="mt-6" variant="outline" asChild>
					<a href="https://github.com" target="_blank" rel="noreferrer">
						Join the Community
					</a>
				</Button>
			</section>

			<footer className="border-t py-8 text-center text-sm text-muted-foreground">
				<p>© {new Date().getFullYear()} KattoUI. Open source under MIT.</p>
			</footer>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
					{icon}
				</div>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
		</Card>
	);
}

function StackItem({ icon, label }: { icon: React.ReactNode; label: string }) {
	return (
		<div className="flex items-center gap-3">
			<div className="text-primary">{icon}</div>
			<span className="font-medium">{label}</span>
		</div>
	);
}

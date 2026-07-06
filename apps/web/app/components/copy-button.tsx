import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/cn";

interface CopyButtonProps {
	getText: () => string;
	className?: string | undefined;
	label?: string | undefined;
}

export function CopyButton({ getText, className, label = "Copy" }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(getText());
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard API not available
		}
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={cn(
				"inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
				className,
			)}
			aria-label={label}
		>
			{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
			<span>{copied ? "Copied" : "Copy"}</span>
		</button>
	);
}

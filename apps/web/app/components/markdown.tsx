import { isValidElement, useRef } from "react";
import MarkdownSync, { MarkdownHooks } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { cn } from "~/lib/cn";
import { CopyButton } from "./copy-button";

const prettyCodeOptions = {
	theme: { light: "github-light", dark: "github-dark" },
	keepBackground: false,
	bypassInlineCode: true,
} as const;

const mdComponents = {
	pre: PreBlock,
	code: CodeInline,
	a: Anchor,
	table: Table,
	th: Th,
	td: Td,
};

interface MarkdownProps {
	content: string;
	className?: string | undefined;
	streaming?: boolean;
}

export function Markdown({ content, className, streaming = false }: MarkdownProps) {
	return (
		<div className={cn("prose-katto", className)}>
			{streaming ? (
				<MarkdownSync remarkPlugins={[remarkGfm]} components={mdComponents}>
					{content}
				</MarkdownSync>
			) : (
				<MarkdownHooks
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[[rehypePrettyCode, prettyCodeOptions]]}
					components={mdComponents}
				>
					{content}
				</MarkdownHooks>
			)}
		</div>
	);
}

function PreBlock(props: PreProps) {
	const { node: _node, children, ...rest } = props;
	const preRef = useRef<HTMLPreElement>(null);

	let language = "text";
	const child = Array.isArray(children) ? children[0] : children;
	if (isValidElement(child)) {
		const lang = (child.props as { "data-language"?: string })["data-language"];
		if (lang) language = lang;
	}

	return (
		<div className="my-3 overflow-hidden rounded-lg border bg-muted/30">
			<div className="flex items-center justify-between border-b px-3 py-1.5">
				<span className="text-xs font-medium text-muted-foreground">{language}</span>
				<CopyButton getText={() => preRef.current?.textContent ?? ""} />
			</div>
			<pre ref={preRef} className="overflow-x-auto p-3 text-xs leading-relaxed" {...rest}>
				{children}
			</pre>
		</div>
	);
}

function CodeInline(props: CodeProps) {
	const { node: _node, className, children, ...rest } = props;
	if (className) {
		return (
			<code className={className} {...rest}>
				{children}
			</code>
		);
	}
	return (
		<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" {...rest}>
			{children}
		</code>
	);
}

function Anchor(props: AnchorProps) {
	const { node: _node, children, ...rest } = props;
	return (
		<a
			className="text-primary underline underline-offset-2 hover:text-primary/80"
			target="_blank"
			rel="noopener noreferrer"
			{...rest}
		>
			{children}
		</a>
	);
}

function Table(props: TableProps) {
	const { node: _node, children } = props;
	return (
		<div className="my-3 overflow-x-auto">
			<table className="w-full border-collapse text-xs">{children}</table>
		</div>
	);
}

function Th(props: ThProps) {
	const { node: _node, children } = props;
	return <th className="border px-2 py-1 text-left font-medium">{children}</th>;
}

function Td(props: TdProps) {
	const { node: _node, children } = props;
	return <td className="border px-2 py-1">{children}</td>;
}

type PreProps = React.ComponentProps<"pre"> & { node?: unknown };
type CodeProps = React.ComponentProps<"code"> & { node?: unknown };
type AnchorProps = React.ComponentProps<"a"> & { node?: unknown };
type TableProps = React.ComponentProps<"table"> & { node?: unknown };
type ThProps = React.ComponentProps<"th"> & { node?: unknown };
type TdProps = React.ComponentProps<"td"> & { node?: unknown };

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/components/markdown", () => ({
	Markdown: ({ content }: { content: string; streaming?: boolean }) => (
		<div data-testid="markdown">{content}</div>
	),
}));

const writeText = vi.fn().mockResolvedValue(undefined);

import type { MessageItemProps } from "~/components/chat-message";
import { MessageItem } from "~/components/chat-message";

function renderMessage(props: MessageItemProps) {
	return render(<MessageItem {...props} />);
}

describe("MessageItem", () => {
	beforeEach(() => {
		writeText.mockClear();
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			writable: true,
			configurable: true,
		});
	});

	it("renders user content as plain text", () => {
		renderMessage({ role: "user", content: "hello user" });
		expect(screen.getByText("hello user")).toBeInTheDocument();
	});

	it("renders assistant content via Markdown", () => {
		renderMessage({ role: "assistant", content: "**bold**" });
		expect(screen.getByTestId("markdown")).toHaveTextContent("**bold**");
	});

	it("shows token usage for assistant messages with token data", () => {
		renderMessage({
			role: "assistant",
			content: "response",
			tokensPrompt: 120,
			tokensCompletion: 480,
			tokensTotal: 600,
		});
		expect(screen.getByText(/↑ 120/)).toBeInTheDocument();
		expect(screen.getByText(/↓ 480/)).toBeInTheDocument();
	});

	it("does not show token usage while streaming", () => {
		renderMessage({
			role: "assistant",
			content: "streaming...",
			streaming: true,
			tokensTotal: 600,
		});
		expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
	});

	it("shows Thinking indicator when streaming with no content", () => {
		renderMessage({ role: "assistant", content: "", streaming: true });
		expect(screen.getByText("Thinking...")).toBeInTheDocument();
		expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
	});

	it("renders markdown when streaming with content", () => {
		renderMessage({ role: "assistant", content: "partial response", streaming: true });
		expect(screen.getByTestId("markdown")).toHaveTextContent("partial response");
		expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
	});

	it("shows copy button for assistant messages", () => {
		renderMessage({ role: "assistant", content: "copy me" });
		expect(screen.getByText("Copy")).toBeInTheDocument();
	});

	it("does not show copy button for user messages", () => {
		renderMessage({ role: "user", content: "no copy" });
		expect(screen.queryByText("Copy")).not.toBeInTheDocument();
	});

	it("copies message content on click", async () => {
		renderMessage({ role: "assistant", content: "copy this" });
		fireEvent.click(screen.getByText("Copy"));
		await screen.findByText("Copied");
		expect(writeText).toHaveBeenCalledWith("copy this");
	});
});

describe("MessageItem edit", () => {
	it("shows an edit button on user messages when onEdit is provided", () => {
		renderMessage({ role: "user", content: "edit me", onEdit: vi.fn() });
		expect(screen.getByRole("button", { name: "Edit message" })).toBeInTheDocument();
	});

	it("does not show an edit button when onEdit is not provided", () => {
		renderMessage({ role: "user", content: "no edit" });
		expect(screen.queryByRole("button", { name: "Edit message" })).not.toBeInTheDocument();
	});

	it("does not show an edit button on assistant messages", () => {
		renderMessage({ role: "assistant", content: "assistant", onEdit: vi.fn() });
		expect(screen.queryByRole("button", { name: "Edit message" })).not.toBeInTheDocument();
	});

	it("enters edit mode with a textarea and save/cancel buttons on edit click", () => {
		renderMessage({ role: "user", content: "original", onEdit: vi.fn() });
		fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
		expect(screen.getByRole("textbox")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save edit" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
	});

	it("cancel exits edit mode and restores the original content", () => {
		renderMessage({ role: "user", content: "original", onEdit: vi.fn() });
		fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "changed" } });
		fireEvent.click(screen.getByRole("button", { name: "Cancel edit" }));
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
		expect(screen.getByText("original")).toBeInTheDocument();
	});

	it("save calls onEdit with the trimmed new value and exits edit mode", () => {
		const onEdit = vi.fn();
		renderMessage({ role: "user", content: "original", onEdit });
		fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "  new content  " } });
		fireEvent.click(screen.getByRole("button", { name: "Save edit" }));
		expect(onEdit).toHaveBeenCalledWith("new content");
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	});

	it("save does not call onEdit when the value is unchanged", () => {
		const onEdit = vi.fn();
		renderMessage({ role: "user", content: "same", onEdit });
		fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
		fireEvent.click(screen.getByRole("button", { name: "Save edit" }));
		expect(onEdit).not.toHaveBeenCalled();
	});

	it("save does not call onEdit when the value is empty or whitespace", () => {
		const onEdit = vi.fn();
		renderMessage({ role: "user", content: "original", onEdit });
		fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
		fireEvent.click(screen.getByRole("button", { name: "Save edit" }));
		expect(onEdit).not.toHaveBeenCalled();
	});
});

describe("MessageItem regenerate", () => {
	it("shows a retry button when canRegenerate and onRegenerate are provided", () => {
		renderMessage({
			role: "assistant",
			content: "resp",
			canRegenerate: true,
			onRegenerate: vi.fn(),
		});
		expect(screen.getByRole("button", { name: "Regenerate response" })).toBeInTheDocument();
	});

	it("does not show a retry button when canRegenerate is false", () => {
		renderMessage({
			role: "assistant",
			content: "resp",
			canRegenerate: false,
			onRegenerate: vi.fn(),
		});
		expect(screen.queryByRole("button", { name: "Regenerate response" })).not.toBeInTheDocument();
	});

	it("does not show a retry button when onRegenerate is not provided", () => {
		renderMessage({ role: "assistant", content: "resp", canRegenerate: true });
		expect(screen.queryByRole("button", { name: "Regenerate response" })).not.toBeInTheDocument();
	});

	it("does not show a retry button on user messages", () => {
		renderMessage({ role: "user", content: "resp", canRegenerate: true, onRegenerate: vi.fn() });
		expect(screen.queryByRole("button", { name: "Regenerate response" })).not.toBeInTheDocument();
	});

	it("calls onRegenerate when the retry button is clicked", () => {
		const onRegenerate = vi.fn();
		renderMessage({ role: "assistant", content: "resp", canRegenerate: true, onRegenerate });
		fireEvent.click(screen.getByRole("button", { name: "Regenerate response" }));
		expect(onRegenerate).toHaveBeenCalledTimes(1);
	});
});

describe("MessageItem reasoning", () => {
	it("does not show reasoning dropdown when reasoning is not provided", () => {
		renderMessage({ role: "assistant", content: "answer" });
		expect(screen.queryByText("Reasoning")).not.toBeInTheDocument();
	});

	it("shows reasoning button when reasoning is provided", () => {
		renderMessage({ role: "assistant", content: "answer", reasoning: "my thought process" });
		expect(screen.getByText("Reasoning")).toBeInTheDocument();
	});

	it("does not show reasoning content when collapsed", () => {
		renderMessage({ role: "assistant", content: "answer", reasoning: "my thought process" });
		expect(screen.queryByText("my thought process")).not.toBeInTheDocument();
	});

	it("expands reasoning content on click", () => {
		renderMessage({ role: "assistant", content: "answer", reasoning: "my thought process" });
		fireEvent.click(screen.getByText("Reasoning"));
		expect(screen.getByText("my thought process")).toBeInTheDocument();
	});

	it("collapses reasoning content on second click", async () => {
		renderMessage({ role: "assistant", content: "answer", reasoning: "my thought process" });
		const btn = screen.getByText("Reasoning");
		fireEvent.click(btn);
		expect(screen.getByText("my thought process")).toBeInTheDocument();
		fireEvent.click(btn);
		await waitFor(() => {
			expect(screen.queryByText("my thought process")).not.toBeInTheDocument();
		});
	});

	it("does not show reasoning dropdown for user messages", () => {
		renderMessage({ role: "user", content: "question", reasoning: "should not appear" });
		expect(screen.queryByText("Reasoning")).not.toBeInTheDocument();
	});

	it("auto-expands when streaming reasoning arrives", () => {
		renderMessage({
			role: "assistant",
			content: "",
			streaming: true,
			streamingReasoning: "thinking live...",
		});
		expect(screen.getByText("thinking live...")).toBeInTheDocument();
	});

	it("does not show Thinking indicator when streaming reasoning is present", () => {
		renderMessage({
			role: "assistant",
			content: "",
			streaming: true,
			streamingReasoning: "thinking...",
		});
		expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
	});
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "~/components/command-palette";
import { useUIStore } from "~/stores/ui-store";

vi.mock("~/lib/commands", () => ({
	coreCommands: [
		{
			id: "test:one",
			label: "Test One",
			shortLabel: "One",
			icon: "Bot",
			keywords: ["first"],
			group: "Test",
			execute: (ctx: { closePalette: () => void }) => ctx.closePalette(),
		},
		{
			id: "test:two",
			label: "Test Two",
			shortLabel: "Two",
			icon: "Settings",
			keywords: ["second"],
			group: "Test",
			execute: (ctx: { closePalette: () => void }) => ctx.closePalette(),
		},
		{
			id: "test:three",
			label: "Test Three",
			shortLabel: "Three",
			icon: "Palette",
			keywords: ["third"],
			group: "Test",
			execute: (ctx: { closePalette: () => void }) => ctx.closePalette(),
		},
	],
	getCommandIcon: () => undefined,
}));

describe("CommandPalette", () => {
	beforeEach(() => {
		Element.prototype.scrollIntoView = vi.fn();
		useUIStore.setState({ commandPaletteOpen: true });
	});

	afterEach(() => {
		useUIStore.setState({ commandPaletteOpen: false });
	});

	it("renders commands when open", () => {
		render(<CommandPalette />);
		expect(screen.getByText("Test One")).toBeInTheDocument();
		expect(screen.getByText("Test Two")).toBeInTheDocument();
		expect(screen.getByText("Test Three")).toBeInTheDocument();
	});

	it("highlights first command by default", () => {
		render(<CommandPalette />);
		const buttons = screen.getAllByRole("button");
		expect(buttons[0]).toHaveClass("bg-accent");
		expect(buttons[1]).not.toHaveClass("bg-accent");
	});

	it("ArrowDown moves selection down", () => {
		render(<CommandPalette />);
		const input = screen.getByPlaceholderText("Type a command or search...");
		fireEvent.keyDown(input, { key: "ArrowDown" });
		const buttons = screen.getAllByRole("button");
		expect(buttons[1]).toHaveClass("bg-accent");
		expect(buttons[0]).not.toHaveClass("bg-accent");
	});

	it("ArrowUp wraps to last item", () => {
		render(<CommandPalette />);
		const input = screen.getByPlaceholderText("Type a command or search...");
		fireEvent.keyDown(input, { key: "ArrowUp" });
		const buttons = screen.getAllByRole("button");
		expect(buttons[2]).toHaveClass("bg-accent");
	});

	it("Enter executes selected command and closes palette", () => {
		render(<CommandPalette />);
		const input = screen.getByPlaceholderText("Type a command or search...");
		fireEvent.keyDown(input, { key: "Enter" });
		expect(useUIStore.getState().commandPaletteOpen).toBe(false);
	});

	it("typing resets selection to first result", () => {
		render(<CommandPalette />);
		const input = screen.getByPlaceholderText("Type a command or search...");
		fireEvent.keyDown(input, { key: "ArrowDown" });
		fireEvent.change(input, { target: { value: "test" } });
		const buttons = screen.getAllByRole("button");
		expect(buttons[0]).toHaveClass("bg-accent");
	});
});

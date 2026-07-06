import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "~/components/ui/dialog";

describe("Dialog", () => {
	it("renders title, description, children, and footer when open", () => {
		render(
			<Dialog
				open
				onOpenChange={vi.fn()}
				title="Rename"
				description="Enter a new title"
				footer={<button type="button">Save</button>}
			>
				<input />
			</Dialog>,
		);
		expect(screen.getByText("Rename")).toBeInTheDocument();
		expect(screen.getByText("Enter a new title")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	it("renders nothing when closed", () => {
		render(
			<Dialog open={false} onOpenChange={vi.fn()} title="Hidden">
				body
			</Dialog>,
		);
		expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
	});

	it("calls onOpenChange(false) on Escape", () => {
		const onOpenChange = vi.fn();
		render(
			<Dialog open onOpenChange={onOpenChange} title="T">
				body
			</Dialog>,
		);
		fireEvent.keyDown(document, { key: "Escape" });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("closes when clicking the overlay backdrop", () => {
		const onOpenChange = vi.fn();
		render(
			<Dialog open onOpenChange={onOpenChange} title="T">
				body
			</Dialog>,
		);
		const dialog = document.querySelector("dialog");
		expect(dialog).not.toBeNull();
		fireEvent.mouseDown(dialog as Element);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("does not close when clicking inside the panel", () => {
		const onOpenChange = vi.fn();
		render(
			<Dialog open onOpenChange={onOpenChange} title="T">
				body
			</Dialog>,
		);
		fireEvent.mouseDown(screen.getByText("T"));
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it("renders without a title or labelledby when none is provided", () => {
		render(
			<Dialog open onOpenChange={vi.fn()}>
				just body
			</Dialog>,
		);
		expect(screen.getByText("just body")).toBeInTheDocument();
		expect(document.querySelector("#dialog-title")).toBeNull();
	});
});

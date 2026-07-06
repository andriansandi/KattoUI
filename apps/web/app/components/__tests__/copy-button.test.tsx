import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "~/components/copy-button";

const writeText = vi.fn().mockResolvedValue(undefined);

describe("CopyButton", () => {
	beforeEach(() => {
		writeText.mockClear();
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			writable: true,
			configurable: true,
		});
	});

	it("renders with Copy label", () => {
		render(<CopyButton getText={() => "hello"} />);
		expect(screen.getByText("Copy")).toBeInTheDocument();
	});

	it("copies text to clipboard on click", async () => {
		render(<CopyButton getText={() => "hello world"} />);
		fireEvent.click(screen.getByRole("button"));
		await screen.findByText("Copied");
		expect(writeText).toHaveBeenCalledWith("hello world");
	});

	it("shows Copied state after clicking", async () => {
		render(<CopyButton getText={() => "code"} />);
		fireEvent.click(screen.getByRole("button"));
		expect(await screen.findByText("Copied")).toBeInTheDocument();
	});

	it("supports custom label", () => {
		render(<CopyButton getText={() => "x"} label="Copy code" />);
		expect(screen.getByLabelText("Copy code")).toBeInTheDocument();
	});
});

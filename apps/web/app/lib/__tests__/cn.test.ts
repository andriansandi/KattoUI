import { describe, expect, it } from "vitest";
import { cn } from "~/lib/cn";

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("handles conditional classes", () => {
		expect(cn("base", false && "hidden", "visible")).toBe("base visible");
	});

	it("deduplicates tailwind conflicts (last wins)", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});
});

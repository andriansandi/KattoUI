import { describe, expect, it } from "vitest";
import { messageUpdateSchema, streamMessageSchema } from "../validation";

describe("messageUpdateSchema", () => {
	it("accepts an object with non-empty content", () => {
		const result = messageUpdateSchema.safeParse({ content: "edited text" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.content).toBe("edited text");
		}
	});

	it("rejects empty content", () => {
		const result = messageUpdateSchema.safeParse({ content: "" });
		expect(result.success).toBe(false);
	});

	it("rejects missing content", () => {
		const result = messageUpdateSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects content exceeding the max length", () => {
		const result = messageUpdateSchema.safeParse({ content: "a".repeat(100_001) });
		expect(result.success).toBe(false);
	});
});

describe("streamMessageSchema", () => {
	it("accepts content without regenerate", () => {
		const result = streamMessageSchema.safeParse({ content: "hello" });
		expect(result.success).toBe(true);
	});

	it("accepts regenerate true without content", () => {
		const result = streamMessageSchema.safeParse({ regenerate: true });
		expect(result.success).toBe(true);
	});

	it("accepts content together with regenerate true", () => {
		const result = streamMessageSchema.safeParse({ content: "hello", regenerate: true });
		expect(result.success).toBe(true);
	});

	it("rejects an empty object (no content and no regenerate)", () => {
		const result = streamMessageSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects empty content without regenerate", () => {
		const result = streamMessageSchema.safeParse({ content: "" });
		expect(result.success).toBe(false);
	});

	it("rejects regenerate false without content", () => {
		const result = streamMessageSchema.safeParse({ regenerate: false });
		expect(result.success).toBe(false);
	});

	it("rejects regenerate false with empty content", () => {
		const result = streamMessageSchema.safeParse({ regenerate: false, content: "" });
		expect(result.success).toBe(false);
	});

	it("accepts optional model and providerConfigId alongside content", () => {
		const result = streamMessageSchema.safeParse({
			content: "hello",
			model: "gpt-4o",
			providerConfigId: "cfg_1",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.model).toBe("gpt-4o");
			expect(result.data.providerConfigId).toBe("cfg_1");
		}
	});
});

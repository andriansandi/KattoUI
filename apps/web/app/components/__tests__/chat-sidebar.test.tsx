import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	updateMutate: vi.fn(),
	conversations: [] as Array<{
		id: string;
		title: string;
		pinned: boolean;
		favorited: boolean;
		updatedAt: number;
	}>,
}));

vi.mock("~/lib/queries/conversations", () => ({
	useConversations: () => ({
		data: { conversations: mocks.conversations },
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	}),
	useCreateConversation: () => ({ mutate: vi.fn(), isPending: false }),
	useUpdateConversation: () => ({ mutate: mocks.updateMutate }),
	useDeleteConversation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@clerk/clerk-react", () => ({
	UserButton: () => <div data-testid="user-button" />,
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: { children: ReactNode; [key: string]: unknown }) => <div>{children}</div>,
	useNavigate: () => vi.fn(),
	useRouterState: ({
		select,
	}: {
		select: (s: { location: { pathname: string } }) => string;
	}) => select({ location: { pathname: "/" } }),
}));

vi.mock("~/components/client-only", () => ({
	ClientOnly: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { ChatSidebar } from "~/components/chat-sidebar";

describe("ChatSidebar favorites", () => {
	beforeEach(() => {
		mocks.updateMutate.mockClear();
		mocks.conversations = [
			{
				id: "fav-1",
				title: "Favorited Chat",
				pinned: false,
				favorited: true,
				updatedAt: Date.now(),
			},
			{
				id: "plain-1",
				title: "Plain Chat",
				pinned: false,
				favorited: false,
				updatedAt: Date.now(),
			},
		];
	});

	afterEach(() => {
		mocks.conversations = [];
	});

	it("renders all conversations by default", () => {
		render(<ChatSidebar />);
		expect(screen.getByText("Favorited Chat")).toBeInTheDocument();
		expect(screen.getByText("Plain Chat")).toBeInTheDocument();
	});

	it("Favorites filter hides non-favorited conversations", () => {
		render(<ChatSidebar />);
		fireEvent.click(screen.getByRole("button", { name: "Favorites" }));
		expect(screen.getByText("Favorited Chat")).toBeInTheDocument();
		expect(screen.queryByText("Plain Chat")).not.toBeInTheDocument();
	});

	it("clicking Favorite in the menu toggles favorite via update mutation", () => {
		mocks.conversations = [
			{
				id: "plain-1",
				title: "Plain Chat",
				pinned: false,
				favorited: false,
				updatedAt: Date.now(),
			},
		];
		render(<ChatSidebar />);
		fireEvent.click(screen.getByRole("button", { name: "More actions" }));
		fireEvent.click(screen.getByRole("button", { name: "Favorite" }));
		expect(mocks.updateMutate).toHaveBeenCalledWith({ id: "plain-1", favorited: true });
	});

	it("shows No favorites yet when filter is active and none are favorited", () => {
		mocks.conversations = [
			{
				id: "plain-1",
				title: "Plain Chat",
				pinned: false,
				favorited: false,
				updatedAt: Date.now(),
			},
		];
		render(<ChatSidebar />);
		fireEvent.click(screen.getByRole("button", { name: "Favorites" }));
		expect(screen.getByText("No favorites yet")).toBeInTheDocument();
		expect(screen.queryByText("Plain Chat")).not.toBeInTheDocument();
	});
});

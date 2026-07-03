import { SignUp } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold text-foreground">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						K
					</div>
					<span>KattoUI</span>
				</div>
				<SignUp signInUrl="/sign-in" redirectUrl="/chat" />
			</div>
		</div>
	);
}

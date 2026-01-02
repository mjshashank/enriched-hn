import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="text-center space-y-6">
				<h1 className="text-4xl font-bold tracking-tight">Enriched HN</h1>
				<p className="text-muted-foreground max-w-md">
					An alternative Hacker News frontend with AI-powered insights.
				</p>
				<Button>Get Started</Button>
			</div>
		</main>
	);
}


import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        // Fetch public repos
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Resume-Builder-SaaS"
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: response.status });
        }

        const repos = await response.json();

        // Map repos to Projects
        const projects = repos.map((repo: any) => ({
            id: `gh_${repo.id}`,
            name: repo.name,
            description: repo.description ? repo.description : `GitHub repository: ${repo.name}`,
            technologies: repo.language ? repo.language : "",
            link: repo.html_url
        }));

        // Extract languages for Skills
        // Get all languages, filter nulls, and unique them
        const allLanguages = repos
            .map((repo: any) => repo.language)
            .filter((lang: string | null) => lang !== null);

        // Count frequency to find top skills? Or just list them all?
        // Let's just list unique ones for now.
        const uniqueLanguages = Array.from(new Set(allLanguages)).join(", ");

        return NextResponse.json({
            projects,
            skills: uniqueLanguages
        });

    } catch (error) {
        console.error("GitHub API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

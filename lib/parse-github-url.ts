export function parseGithubUrl(
  url: string,
): { owner: string; name: string } | null {
  try {
    const parsed = new URL(url);

    if (!/^(www\.)?github\.com$/.test(parsed.hostname)) {
      return null;
    }

    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return null;
    }

    return { owner, name: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

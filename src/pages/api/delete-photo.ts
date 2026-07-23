export const prerender = false;

import type { APIRoute } from "astro";

const OWNER = import.meta.env.GITHUB_OWNER;
const REPO = import.meta.env.GITHUB_REPO;
const TOKEN = import.meta.env.GITHUB_TOKEN;
const BRANCH = import.meta.env.GITHUB_BRANCH || "main";
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;

async function gh(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!OWNER || !REPO || !TOKEN || !ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Server is missing required env vars." }), { status: 500 });
    }

    const body = await request.json();
    // Accept either a single `id` or a batch `ids` array — the admin page
    // always sends `ids` now, `id` is kept for backwards compatibility.
    const { password, id, ids } = body as { password?: string; id?: string; ids?: string[] };
    const targetIds = ids && ids.length > 0 ? ids : id ? [id] : [];

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Incorrect password." }), { status: 401 });
    }
    if (targetIds.length === 0) {
      return new Response(JSON.stringify({ error: "No photo id(s) provided." }), { status: 400 });
    }

    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;
    const latestCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha;

    const fileRes = await gh(`/repos/${OWNER}/${REPO}/contents/src/data/photos.ts?ref=${BRANCH}`);
    let currentContent = Buffer.from(fileRes.content, "base64").toString("utf-8");

    const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
    const removed: string[] = [];
    const notFound: string[] = [];

    for (const targetId of targetIds) {
      const lineRegex = new RegExp(`\\n\\s*\\{ id: "${targetId}".*?\\},?`);
      const lineMatch = currentContent.match(lineRegex);
      if (!lineMatch) {
        notFound.push(targetId);
        continue;
      }

      const imagePathMatch = lineMatch[0].match(/image:\s*"([^"]+)"/);
      currentContent = currentContent.replace(lineRegex, "");
      removed.push(targetId);

      if (imagePathMatch) {
        const publicPath = imagePathMatch[1];
        treeItems.push({ path: `public${publicPath}`, mode: "100644", type: "blob", sha: null });
      }
    }

    if (removed.length === 0) {
      return new Response(JSON.stringify({ error: `No matching photo(s) found: ${notFound.join(", ")}` }), {
        status: 404,
      });
    }

    const photosBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: currentContent, encoding: "utf-8" }),
    });
    treeItems.push({ path: "src/data/photos.ts", mode: "100644", type: "blob", sha: photosBlob.sha });

    const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Remove ${removed.length} photo(s) via admin`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return new Response(
      JSON.stringify({ ok: true, commit: newCommit.sha, removed: removed.length, notFound }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};

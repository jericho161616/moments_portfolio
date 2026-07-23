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
    const { password, id } = body as { password?: string; id?: string };

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Incorrect password." }), { status: 401 });
    }
    if (!id) {
      return new Response(JSON.stringify({ error: "No photo id provided." }), { status: 400 });
    }

    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;
    const latestCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha;

    const fileRes = await gh(`/repos/${OWNER}/${REPO}/contents/src/data/photos.ts?ref=${BRANCH}`);
    const currentContent = Buffer.from(fileRes.content, "base64").toString("utf-8");

    const lineRegex = new RegExp(`\\n\\s*\\{ id: "${id}".*?\\},?`);
    const lineMatch = currentContent.match(lineRegex);
    if (!lineMatch) {
      return new Response(JSON.stringify({ error: `Photo "${id}" not found in photos.ts.` }), { status: 404 });
    }

    const imagePathMatch = lineMatch[0].match(/image:\s*"([^"]+)"/);
    const updatedContent = currentContent.replace(lineRegex, "");

    const photosBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: updatedContent, encoding: "utf-8" }),
    });

    const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [
      { path: "src/data/photos.ts", mode: "100644", type: "blob", sha: photosBlob.sha },
    ];

    // Also remove the image file itself, if it pointed at one under public/images.
    if (imagePathMatch) {
      const publicPath = imagePathMatch[1];
      const repoPath = `public${publicPath}`;
      try {
        const existing = await gh(`/repos/${OWNER}/${REPO}/contents/${repoPath}?ref=${BRANCH}`);
        // Deleting a blob via the tree API means omitting it; the contents API delete
        // endpoint needs its own commit, so instead we mark it for removal by using
        // a tree entry with sha: null, which git trees support for deletions.
        treeItems.push({ path: repoPath, mode: "100644", type: "blob", sha: null as unknown as string });
        void existing;
      } catch {
        // File didn't exist or couldn't be found — nothing to remove, continue.
      }
    }

    const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Remove photo "${id}" via admin`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return new Response(JSON.stringify({ ok: true, commit: newCommit.sha }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};

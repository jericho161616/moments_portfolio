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
    const { password, ids } = body as { password?: string; ids?: string[] };

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Incorrect password." }), { status: 401 });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: "No photo order provided." }), { status: 400 });
    }

    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;
    const latestCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha;

    const fileRes = await gh(`/repos/${OWNER}/${REPO}/contents/src/data/photos.ts?ref=${BRANCH}`);
    const currentContent = Buffer.from(fileRes.content, "base64").toString("utf-8");

    const entryRegex = /\n\s*\{ id: "([^"]+)".*?\},?/g;
    const entriesById = new Map<string, string>();
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(currentContent)) !== null) {
      entriesById.set(match[1], match[0].replace(/^\n/, "").replace(/,?$/, ",").trimEnd());
    }

    if (entriesById.size === 0) {
      return new Response(JSON.stringify({ error: "Could not find any photo entries in photos.ts." }), {
        status: 500,
      });
    }

    const orderedIds = [...ids.filter((id) => entriesById.has(id))];
    for (const existingId of entriesById.keys()) {
      if (!orderedIds.includes(existingId)) orderedIds.push(existingId);
    }

    const newEntriesBlock = orderedIds.map((id) => `  ${entriesById.get(id)}`).join("\n");
    const updatedContent = currentContent.replace(
      /export const photos: Photo\[\] = \[[\s\S]*?\n\];/,
      `export const photos: Photo[] = [\n${newEntriesBlock}\n];`,
    );

    if (updatedContent === currentContent) {
      return new Response(JSON.stringify({ error: "Could not locate the photos array to update." }), {
        status: 500,
      });
    }

    const photosBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: updatedContent, encoding: "utf-8" }),
    });

    const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [{ path: "src/data/photos.ts", mode: "100644", type: "blob", sha: photosBlob.sha }],
      }),
    });

    const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: "Reorder photos via admin",
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

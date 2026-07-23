export const prerender = false;

import type { APIRoute } from "astro";

const OWNER = import.meta.env.GITHUB_OWNER;
const REPO = import.meta.env.GITHUB_REPO;
const TOKEN = import.meta.env.GITHUB_TOKEN;
const BRANCH = import.meta.env.GITHUB_BRANCH || "main";
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;

type Category = "bw" | "color" | "film";

interface IncomingPhoto {
  title: string;
  category: Category;
  size?: "square" | "wide" | "tall";
  filename: string;
  dataUrl: string;
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "photo";
}

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
      return new Response(
        JSON.stringify({ error: "Server is missing GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, or ADMIN_PASSWORD env vars." }),
        { status: 500 },
      );
    }

    const body = await request.json();
    const { password, photos } = body as { password?: string; photos?: IncomingPhoto[] };

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Incorrect password." }), { status: 401 });
    }
    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "No photos were provided." }), { status: 400 });
    }

    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;
    const latestCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha;

    const fileRes = await gh(`/repos/${OWNER}/${REPO}/contents/src/data/photos.ts?ref=${BRANCH}`);
    const currentContent = Buffer.from(fileRes.content, "base64").toString("utf-8");

    const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
    const newEntries: string[] = [];
    const usedSlugs = new Set<string>();

    for (const photo of photos) {
      const match = photo.dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) continue;

      const base64Data = match[2];
      const ext = (photo.filename.split(".").pop() || "jpg").toLowerCase();

      let slug = slugify(photo.title);
      while (usedSlugs.has(slug)) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }
      usedSlugs.add(slug);

      const filePath = `public/images/${photo.category}/${slug}.${ext}`;

      const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: base64Data, encoding: "base64" }),
      });

      treeItems.push({ path: filePath, mode: "100644", type: "blob", sha: blob.sha });

      const publicPath = "/" + filePath.replace(/^public\//, "");
      const sizeField = photo.size && photo.size !== "square" ? `, size: "${photo.size}"` : "";
      const safeTitle = photo.title.replace(/"/g, '\\"');
      newEntries.push(
        `  { id: "${slug}", title: "${safeTitle}", category: "${photo.category}"${sizeField}, image: "${publicPath}" },`,
      );
    }

    if (newEntries.length === 0) {
      return new Response(JSON.stringify({ error: "No valid images in the upload." }), { status: 400 });
    }

    const updatedContent = currentContent.replace(/\n\];\s*$/, `\n${newEntries.join("\n")}\n];\n`);

    const photosBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: updatedContent, encoding: "utf-8" }),
    });
    treeItems.push({ path: "src/data/photos.ts", mode: "100644", type: "blob", sha: photosBlob.sha });

    const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Add ${newEntries.length} photo(s) via admin`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return new Response(JSON.stringify({ ok: true, commit: newCommit.sha, added: newEntries.length }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};

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

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!OWNER || !REPO || !TOKEN || !ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Server is missing required env vars." }), { status: 500 });
    }

    const body = await request.json();
    const {
      password,
      name,
      bio,
      instagramHandle,
      instagramUrl,
      email,
      location,
      photoDataUrl,
    } = body as {
      password?: string;
      name?: string;
      bio?: string[];
      instagramHandle?: string;
      instagramUrl?: string;
      email?: string;
      location?: string;
      photoDataUrl?: string | null;
    };

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Incorrect password." }), { status: 401 });
    }
    if (!name || !Array.isArray(bio) || bio.length === 0) {
      return new Response(JSON.stringify({ error: "Missing name or bio." }), { status: 400 });
    }

    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;
    const latestCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha;

    const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
    let photoPath: string | null = null;

    if (photoDataUrl) {
      const match = photoDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content: match[2], encoding: "base64" }),
        });
        photoPath = "/images/about/profile.jpg";
        treeItems.push({
          path: `public${photoPath}`,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      }
    }

    // If no new photo was uploaded, keep whatever is currently referenced in about.ts.
    if (!photoPath) {
      const currentAboutRes = await gh(`/repos/${OWNER}/${REPO}/contents/src/data/about.ts?ref=${BRANCH}`);
      const currentAbout = Buffer.from(currentAboutRes.content, "base64").toString("utf-8");
      const existingPhotoMatch = currentAbout.match(/photo:\s*"([^"]+)"/);
      photoPath = existingPhotoMatch ? existingPhotoMatch[1] : null;
    }

    const bioLines = bio.map((p) => `    "${esc(p)}",`).join("\n");
    const newContent = `export interface AboutInfo {
  name: string;
  /** Paragraphs of bio copy, rendered one per <p>. */
  bio: string[];
  instagramHandle: string;
  instagramUrl: string;
  email: string;
  location: string;
  /** Path under /public, e.g. "/images/about/profile.jpg". Null shows a placeholder. */
  photo: string | null;
}

export const about: AboutInfo = {
  name: "${esc(name)}",
  bio: [
${bioLines}
  ],
  instagramHandle: "${esc(instagramHandle ?? "")}",
  instagramUrl: "${esc(instagramUrl ?? "")}",
  email: "${esc(email ?? "")}",
  location: "${esc(location ?? "")}",
  photo: ${photoPath ? `"${photoPath}"` : "null"},
};
`;

    const aboutBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: newContent, encoding: "utf-8" }),
    });
    treeItems.push({ path: "src/data/about.ts", mode: "100644", type: "blob", sha: aboutBlob.sha });

    const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: "Update About page via admin",
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

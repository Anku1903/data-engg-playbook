import type { Plugin } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const FILENAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

const CATEGORY_SLUGS = new Set([
  "python",
  "sql",
  "pyspark",
  "databricks",
  "azure-data-factory",
  "azure-functions",
  "azure-synapse",
  "dbt",
  "airflow",
  "terraform",
  "docker",
  "kubernetes",
  "azure-devops",
]);

interface UploadBody {
  category?: unknown;
  filename?: unknown;
  contents?: unknown;
}

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJson(req: import("node:http").IncomingMessage): Promise<UploadBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export default function uploadPlugin(): Plugin {
  return {
    name: "data-engg-playbook:upload",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__upload", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        let body: UploadBody;
        try {
          body = await readJson(req);
        } catch (e) {
          send(res, 400, { ok: false, error: `Invalid JSON body: ${(e as Error).message}` });
          return;
        }

        const category = typeof body.category === "string" ? body.category : "";
        const filename = typeof body.filename === "string" ? body.filename : "";
        const contents = typeof body.contents === "string" ? body.contents : "";

        if (!category || !filename || !contents) {
          send(res, 400, {
            ok: false,
            error: "Missing required fields: category, filename, contents",
          });
          return;
        }

        if (!CATEGORY_SLUGS.has(category)) {
          send(res, 400, { ok: false, error: `Unknown category "${category}"` });
          return;
        }

        if (!FILENAME_RE.test(filename)) {
          send(res, 400, {
            ok: false,
            error: "Filename must be lowercase kebab-case, e.g. `window-functions.md`",
          });
          return;
        }

        // Re-parse frontmatter server-side — never trust the client.
        let parsed;
        try {
          parsed = matter(contents);
        } catch (e) {
          send(res, 400, {
            ok: false,
            error: `Could not parse frontmatter: ${(e as Error).message}`,
          });
          return;
        }

        const fm = parsed.data as Record<string, unknown>;
        const required = ["title", "category", "subcategory", "tags", "updated"] as const;
        const missing = required.filter(
          k => fm[k] === undefined || fm[k] === null || fm[k] === "",
        );
        if (missing.length > 0) {
          send(res, 400, {
            ok: false,
            error: `Frontmatter missing required fields: ${missing.join(", ")}`,
          });
          return;
        }
        if (!Array.isArray(fm.tags)) {
          send(res, 400, {
            ok: false,
            error: "Frontmatter `tags` must be a YAML list",
          });
          return;
        }

        const fileSlug = filename.replace(/\.md$/, "");
        if (fm.category !== category) {
          send(res, 400, {
            ok: false,
            error: `Frontmatter category "${String(fm.category)}" does not match selected category "${category}"`,
          });
          return;
        }
        if (fm.subcategory !== fileSlug) {
          send(res, 400, {
            ok: false,
            error: `Frontmatter subcategory "${String(fm.subcategory)}" does not match filename "${fileSlug}"`,
          });
          return;
        }

        // Write to src/content/<category>/<filename>
        const targetDir = path.resolve(server.config.root, "src", "content", category);
        const targetPath = path.join(targetDir, filename);

        try {
          await fs.mkdir(targetDir, { recursive: true });
          // Reject if already exists (exclusive write)
          try {
            await fs.access(targetPath);
            send(res, 409, {
              ok: false,
              error: `A file with this name already exists in ${category}`,
            });
            return;
          } catch {
            // does not exist, proceed
          }
          await fs.writeFile(targetPath, contents, { encoding: "utf8", flag: "wx" });
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          if (err.code === "EEXIST") {
            send(res, 409, {
              ok: false,
              error: `A file with this name already exists in ${category}`,
            });
            return;
          }
          send(res, 500, { ok: false, error: `Write failed: ${err.message}` });
          return;
        }

        send(res, 200, {
          ok: true,
          path: `/src/content/${category}/${filename}`,
        });
      });

      // Delete endpoint — removes a file under src/content/<category>/.
      // Validates category + filename and guards against path traversal.
      server.middlewares.use("/__delete", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        let body: UploadBody;
        try {
          body = await readJson(req);
        } catch (e) {
          send(res, 400, { ok: false, error: `Invalid JSON body: ${(e as Error).message}` });
          return;
        }

        const category = typeof body.category === "string" ? body.category : "";
        const filename = typeof body.filename === "string" ? body.filename : "";

        if (!category || !filename) {
          send(res, 400, {
            ok: false,
            error: "Missing required fields: category, filename",
          });
          return;
        }

        if (!CATEGORY_SLUGS.has(category)) {
          send(res, 400, { ok: false, error: `Unknown category "${category}"` });
          return;
        }

        if (!FILENAME_RE.test(filename)) {
          send(res, 400, {
            ok: false,
            error: "Filename must be lowercase kebab-case, e.g. `window-functions.md`",
          });
          return;
        }

        const contentRoot = path.resolve(server.config.root, "src", "content");
        const expectedDir = path.resolve(contentRoot, category);
        const targetPath = path.resolve(expectedDir, filename);

        // Path-traversal guard: resolved path must be inside the expected dir.
        if (
          !targetPath.startsWith(expectedDir + path.sep) &&
          targetPath !== expectedDir
        ) {
          send(res, 400, { ok: false, error: "Invalid path" });
          return;
        }

        try {
          await fs.unlink(targetPath);
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          if (err.code === "ENOENT") {
            send(res, 404, { ok: false, error: "File not found" });
            return;
          }
          send(res, 500, { ok: false, error: `Delete failed: ${err.message}` });
          return;
        }

        send(res, 200, {
          ok: true,
          path: `/src/content/${category}/${filename}`,
        });
      });
    },
  };
}

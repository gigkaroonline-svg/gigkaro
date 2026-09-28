import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src/generated/job-slugs.json");

function loadEnvFile() {
  const path = join(root, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function keepExisting() {
  if (existsSync(outFile)) return;
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, "[]\n");
}

loadEnvFile();
const base = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
).replace(/\/$/, "");

try {
  const res = await fetch(`${base}/jobs`);
  if (!res.ok) {
    console.warn(`Job slug list was not refreshed (${res.status}).`);
    keepExisting();
    process.exit(0);
  }
  const data = await res.json();
  const slugs = [
    ...new Set(
      (data.jobs || [])
        .map((job) => job.slug)
        .filter((slug) => typeof slug === "string" && slug.length > 0),
    ),
  ];
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(slugs, null, 2)}\n`);
  console.log(`Wrote ${slugs.length} job slugs.`);
} catch (err) {
  console.warn(
    `Job slug list was not refreshed (${err instanceof Error ? err.message : "request failed"}).`,
  );
  keepExisting();
}

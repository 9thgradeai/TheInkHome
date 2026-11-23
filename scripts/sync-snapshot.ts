import { writeFileSync } from "node:fs";
import path from "node:path";
import { getPublicationStories } from "../src/lib/api-server.ts";

/**
 * Refreshes the bundled last-known-good stories snapshot from the live Medium
 * feed. Run in CI or manually (`npm run sync:snapshot`) after publishing.
 */
async function main(): Promise<void> {
  const { stories, source } = await getPublicationStories({ force: true });

  if (stories.length === 0 || source.includes("snapshot")) {
    throw new Error(`Refusing to overwrite snapshot: live feed unavailable (source: ${source})`);
  }

  const target = path.resolve(process.cwd(), "src/data/fallbackStories.ts");
  const header = `import type { Story } from "../types.ts";

/**
 * Last-known-good snapshot of real published stories from the Medium feed.
 * Generated from ${new Date().toISOString()} via \`npm run sync:snapshot\`.
 * Used only when every live source (Medium RSS, rss2json) is unreachable so the
 * publication never renders an empty archive. Refresh with \`npm run sync:snapshot\`.
 */
export const FALLBACK_STORIES: Story[] = `;

  writeFileSync(target, `${header}${JSON.stringify(stories, null, 2)};\n`, "utf8");
  console.log(`Wrote ${stories.length} stories to ${target}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

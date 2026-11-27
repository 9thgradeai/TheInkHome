import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AnimatePresence, motion } from "motion/react";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { RouterProvider, usePath, useRouter } from "./router";
import { usePublication } from "./lib/usePublication";
import { applyHomeMeta, applyPageMeta, SITE_META } from "./lib/seo";
import type { Story } from "./types";

const HomePage = lazy(() => import("./pages/HomePage"));
const StoriesPage = lazy(() => import("./pages/StoriesPage"));
const WritersPage = lazy(() => import("./pages/WritersPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));
const ReadingListPage = lazy(() => import("./pages/ReadingListPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const DeskPage = lazy(() => import("./pages/DeskPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AIAssistant = lazy(() => import("./components/AIAssistant"));

const LIKED_KEY = "the-ink-home:liked";
const SAVED_KEY = "the-ink-home:saved";

function readList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    /* storage unavailable — state still holds for the session */
  }
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true" role="status">
      <span className="sr-only">Loading the next page</span>
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
    >
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </motion.div>
  );
}

function AppShell() {
  const { path, navigate } = useRouter();
  const currentPath = usePath();
  const { stories, about, loading, error, live, reload } = usePublication();

  const [liked, setLikedList] = useState<string[]>(() => readList(LIKED_KEY));
  const [saved, setSavedList] = useState<string[]>(() => readList(SAVED_KEY));

  useEffect(() => writeList(LIKED_KEY, liked), [liked]);
  useEffect(() => writeList(SAVED_KEY, saved), [saved]);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => (slug: string) =>
    setter((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );

  const toggleLiked = toggle(setLikedList);
  const toggleSaved = toggle(setSavedList);

  const storySlug = path.startsWith("/story/")
    ? decodeURIComponent(path.slice("/story/".length))
    : null;
  const activeStory = storySlug ? stories.find((story) => story.slug === storySlug) : undefined;

  const authorMatch = path.match(/^\/writer\/([^/]+)$/);
  const authorSlug = authorMatch ? decodeURIComponent(authorMatch[1]) : null;

  const contributors = useMemo(() => {
    const map = new Map<string, (typeof about.writers)[number]>();
    for (const person of [...about.editors, ...about.writers]) {
      if (person?.name) map.set(slugify(person.name), person);
    }
    for (const story of stories) {
      const key = slugify(story.author);
      if (key && !map.has(key)) {
        map.set(key, {
          name: story.author,
          role: story.role || "Contributor",
          bio: undefined,
          avatar: story.avatar,
          followers: undefined,
          mediumUrl: undefined,
        });
      }
    }
    return map;
  }, [about, stories]);

  const authorPerson = authorSlug ? contributors.get(authorSlug) ?? null : null;
  const authorStories = authorPerson
    ? stories.filter((story) => slugify(story.author) === slugify(authorPerson.name))
    : [];

  const contributorList = useMemo(
    () =>
      Array.from(contributors.values())
        .filter((person) => !about.editors.some((editor) => editor.name === person.name))
        .map((person) => ({
          ...person,
          count: stories.filter((story) => slugify(story.author) === slugify(person.name)).length,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [contributors, about.editors, stories],
  );

  const savedStories = useMemo(
    () => saved.map((slug) => stories.find((story) => story.slug === slug)).filter(Boolean) as Story[],
    [saved, stories],
  );
  const likedStories = useMemo(
    () => liked.map((slug) => stories.find((story) => story.slug === slug)).filter(Boolean) as Story[],
    [liked, stories],
  );

  // Keep the document head in step with the client-side route.
  useEffect(() => {
    if (activeStory) {
      applyPageMeta({
        title: activeStory.title,
        description: activeStory.description || "A story from The Ink Home on Medium.",
        path: `/story/${encodeURIComponent(activeStory.slug)}`,
        image: activeStory.cover || SITE_META.defaultImage,
        type: "article",
        article: { publishedTime: activeStory.pubDate, author: activeStory.author },
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: activeStory.title,
            description: activeStory.description,
            image: activeStory.cover || SITE_META.defaultImage,
            datePublished: activeStory.pubDate,
            author: { "@type": "Person", name: activeStory.author },
            publisher: { "@type": "Organization", name: SITE_META.siteName },
            mainEntityOfPage: `${SITE_META.siteUrl}/story/${encodeURIComponent(activeStory.slug)}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_META.siteUrl },
              { "@type": "ListItem", position: 2, name: "Stories", item: `${SITE_META.siteUrl}/stories` },
              { "@type": "ListItem", position: 3, name: activeStory.title, item: `${SITE_META.siteUrl}/story/${encodeURIComponent(activeStory.slug)}` },
            ],
          },
        ],
      });
      return;
    }

    const staticMeta: Record<string, { title: string; description: string }> = {
      "/stories": {
        title: "Stories",
        description:
          "Every essay in The Ink Home — searchable across titles, bylines, topics and full text.",
      },
      "/writers": {
        title: "Writers",
        description: "Meet the writers and editors behind The Ink Home.",
      },
      "/about": {
        title: "About",
        description:
          "What The Ink Home publishes, who edits it, and how to submit your writing.",
      },
      "/desk": {
        title: "The Desk",
        description: "A local-first drafting space for preparing work before it goes out.",
      },
      "/saved": {
        title: "Reading list",
        description: "Stories you saved or liked, kept on this device.",
      },
      "/privacy": { title: "Privacy", description: "How The Ink Home handles your data." },
      "/terms": { title: "Terms", description: "Terms of use for The Ink Home." },
      "/editorial": {
        title: "Editorial policy",
        description: "How The Ink Home chooses, edits and credits what it publishes.",
      },
    };

    const meta = staticMeta[currentPath];
    if (meta) applyPageMeta({ ...meta, path: currentPath });
    else if (currentPath === "/") applyHomeMeta();
    else if (!currentPath.startsWith("/writer/")) {
      applyPageMeta({
        title: "Page not found",
        description: "This page is not part of The Ink Home.",
        path: currentPath,
        robots: "noindex, follow",
      });
    }
  }, [activeStory, currentPath]);

  const pageContext = activeStory
    ? "reading"
    : currentPath === "/writers" || currentPath.startsWith("/writer/")
      ? "profile"
      : currentPath === "/desk"
        ? "writing"
        : "browse";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Analytics />
      <SiteHeader />

      <Suspense fallback={null}>
        <AIAssistant storyContext={activeStory} pageContext={pageContext} />
      </Suspense>

      <main id="main">
        <AnimatePresence mode="wait" initial={false}>
          <div key={activeStory ? `story:${activeStory.slug}` : currentPath}>
            {activeStory ? (
              <Page>
                <ReadingPage
                  story={activeStory}
                  stories={stories}
                  editors={about.editors}
                  writers={about.writers}
                  liked={liked.includes(activeStory.slug)}
                  saved={saved.includes(activeStory.slug)}
                  onToggleLike={toggleLiked}
                  onToggleSave={toggleSaved}
                />
              </Page>
            ) : storySlug ? (
              <Page>
                <NotFoundPage
                  title="We couldn't find that story."
                  message="It may have been renamed on Medium, or the link may be out of date. The full archive is one click away."
                />
              </Page>
            ) : currentPath === "/stories" ? (
              <Page>
                <StoriesPage
                  stories={stories}
                  loading={loading && !live}
                  error={error}
                  onRetry={reload}
                />
              </Page>
            ) : currentPath === "/writers" ? (
              <Page>
                <WritersPage editors={about.editors} writers={contributorList} stories={stories} />
              </Page>
            ) : currentPath === "/desk" ? (
              <Page>
                <DeskPage />
              </Page>
            ) : currentPath === "/about" ? (
              <Page>
                <AboutPage
                  about={about}
                  storyCount={stories.length}
                  contributorCount={contributors.size}
                  stories={stories}
                />
              </Page>
            ) : currentPath === "/privacy" ? (
              <Page>
                <LegalPage kind="privacy" />
              </Page>
            ) : currentPath === "/terms" ? (
              <Page>
                <LegalPage kind="terms" />
              </Page>
            ) : currentPath === "/editorial" ? (
              <Page>
                <LegalPage kind="editorial" />
              </Page>
            ) : authorSlug ? (
              <Page>
                <AuthorPage person={authorPerson} stories={authorStories} />
              </Page>
            ) : currentPath === "/saved" ? (
              <Page>
                <ReadingListPage saved={savedStories} liked={likedStories} />
              </Page>
            ) : currentPath === "/" ? (
              <Page>
                <HomePage
                  stories={stories}
                  about={about}
                  loading={loading}
                  error={error}
                  live={live}
                  onRetry={reload}
                />
              </Page>
            ) : (
              <Page>
                <NotFoundPage />
              </Page>
            )}
          </div>
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppShell />
    </RouterProvider>
  );
}

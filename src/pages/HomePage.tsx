import { useMemo, useState } from "react";
import Masthead from "../components/home/Masthead";
import LeadStory from "../components/home/LeadStory";
import LatestSection from "../components/home/LatestSection";
import TopicsSection from "../components/home/TopicsSection";
import WritersSection from "../components/home/WritersSection";
import ColophonSection from "../components/home/ColophonSection";
import FollowSection from "../components/home/FollowSection";
import { deriveContributors, deriveTopics, type AboutData } from "../lib/usePublication";
import type { Story } from "../types";

interface HomePageProps {
  stories: Story[];
  about: AboutData;
  loading: boolean;
  error: boolean;
  live: boolean;
  onRetry: () => void;
}

export default function HomePage({ stories, about, loading, error, live, onRetry }: HomePageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const contributors = useMemo(() => deriveContributors(about, stories), [about, stories]);
  const topics = useMemo(() => deriveTopics(stories, 10), [stories]);
  const contributorCount = useMemo(() => {
    const names = new Set<string>();
    for (const story of stories) names.add(story.author.toLowerCase());
    for (const writer of about.writers) names.add(writer.name.toLowerCase());
    return names.size;
  }, [stories, about.writers]);

  return (
    <>
      <Masthead
        storyCount={stories.length}
        contributorCount={contributorCount}
        loading={loading && !live}
        stories={stories}
      />

      <LeadStory story={stories[0]} loading={loading && !live} />

      <TopicsSection topics={topics} />

      <LatestSection
        stories={stories}
        loading={loading && !live}
        error={error}
        query={query}
        category={category}
        onQuery={setQuery}
        onCategory={setCategory}
        onRetry={onRetry}
      />

      <WritersSection editors={about.editors} writers={contributors} stories={stories} />

      <ColophonSection
        about={about}
        storyCount={stories.length}
        contributorCount={contributorCount}
      />

      <FollowSection />
    </>
  );
}

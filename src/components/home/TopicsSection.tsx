import { useNavigate } from "../../router";
import Reveal from "../ui/Reveal";

interface TopicsSectionProps {
  topics: string[];
}

/** Topic index — the publication's table of subjects. */
export default function TopicsSection({ topics }: TopicsSectionProps) {
  const navigate = useNavigate();
  if (topics.length === 0) return null;

  return (
    <section aria-labelledby="topics-heading" className="border-y border-line bg-sunken">
      <div className="shell py-10 sm:py-12">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="topics-heading" className="eyebrow">
              Browse by topic
            </h2>
            <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-ink-soft">
              Follow a subject all the way down — every essay we have published on it, in one place.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li key={topic}>
                <button
                  type="button"
                  onClick={() => navigate(`/stories?tag=${encodeURIComponent(topic)}`)}
                  className="chip hover:border-ink"
                >
                  {topic}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

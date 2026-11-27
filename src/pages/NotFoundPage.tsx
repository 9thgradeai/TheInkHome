import { ArrowLeft, Compass } from "lucide-react";
import { useNavigate } from "../router";

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

export default function NotFoundPage({
  title = "This page has wandered off.",
  message = "The address may be out of date, or the story may have moved back to Medium. The archive is one click away.",
}: NotFoundPageProps) {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-[70vh] items-center pb-24 pt-28 sm:pt-36">
      <div className="shell">
        <p className="eyebrow">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" /> Not found
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink">
          {title}
        </h1>
        <p className="mt-5 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate("/")} className="btn btn-solid">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the front page
          </button>
          <button type="button" onClick={() => navigate("/stories")} className="btn btn-outline">
            Browse the archive
          </button>
          <a
            href="https://medium.com/the-ink-home"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Open on Medium
          </a>
        </div>
      </div>
    </section>
  );
}

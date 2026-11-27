import { useNavigate } from "../router";

interface LogoProps {
  size?: number;
  /** Hide the wordmark and show only the mark. */
  compact?: boolean;
  className?: string;
}

/** Brand lockup using the publication's own house mark. */
export function Logo({ compact = false, className = "", size = 36 }: LogoProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      aria-label="The Ink Home — home"
      className={`group flex items-center gap-3 text-left ${className}`}
    >
      <img
        src="/assets/The_Ink_Home.webp"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        decoding="async"
        className="h-9 w-9 shrink-0 rounded-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        style={{ width: size, height: size }}
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
            The Ink Home
          </span>
          <span className="mt-[3px] text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
            A PUBLICATION
          </span>
        </span>
      )}
    </button>
  );
}

export default Logo;

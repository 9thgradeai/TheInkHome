import React from "react";
import inkHomeLogo from "../../assets/The_Ink_Home_sm.webp";

interface LogoProps {
  className?: string;
  size?: number;
  iconOnly?: boolean;
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 40,
  iconOnly = false,
  textColor = "text-white",
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={inkHomeLogo}
        alt="The Ink Home Logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain max-w-full max-h-full flex-shrink-0 transition-all duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        decoding="async"
        // @ts-ignore
        fetchPriority="high"
        loading="eager"
      />

      {/* Optional typography lockup - condensed elegant display sans/serif pairing */}
      {!iconOnly && (
        <div className="flex flex-col items-start leading-none">
          <span className={`font-display text-base font-extrabold tracking-widest uppercase ${textColor}`}>
            The Ink Home
          </span>
          <span className="text-[9px] font-mono tracking-[0.25em] text-[var(--atmo-text)] uppercase mt-0.5">
            Spatial Publication
          </span>
        </div>
      )}
    </div>
  );
};

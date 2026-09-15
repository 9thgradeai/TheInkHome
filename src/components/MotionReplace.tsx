import React, { useEffect, useRef, useState } from "react";

interface MotionReplaceProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: { opacity?: number; y?: number; scale?: number; x?: number; rotateX?: number; rotateY?: number };
  animate?: { opacity?: number; y?: number; scale?: number; x?: number; rotateX?: number; rotateY?: number };
  exit?: { opacity?: number; y?: number; scale?: number; x?: number };
  transition?: { duration?: number; delay?: number; ease?: string | number[]; type?: string; stiffness?: number; damping?: number };
  whileHover?: { y?: number; rotateX?: number; rotateY?: number; scale?: number };
  whileTap?: { scale?: number };
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
}

export const MotionReplace: React.FC<MotionReplaceProps> = ({
  initial, animate, exit, transition, whileHover, whileTap,
  className = "", style, children, id, onClick, onMouseMove,
  ...rest
}) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [hoverState, setHoverState] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate && initial) setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exit && visible) {
      setExiting(true);
      setTimeout(() => setVisible(false), 800);
    }
  }, [exit, visible]);

  const animStyle: React.CSSProperties = {
    ...style,
    opacity: exiting ? 0 : visible ? 1 : (initial?.opacity ?? 0),
    transform: exiting
      ? `translateY(${(exit?.y ?? -40)}px) translateX(${(exit?.x ?? 0)}px)`
      : visible
        ? `translateY(${hoverState ? (whileHover?.y ?? 0) : (animate?.y ?? 0)}px) scale(${hoverState ? (whileHover?.scale ?? 1) : (animate?.scale ?? 1)})`
        : `translateY(${initial?.y ?? 0}px) scale(${initial?.scale ?? 1})`,
    animationDuration: `${transition?.duration ?? 0.6}s`,
    animationDelay: `${transition?.delay ?? 0}s`,
    animationFillMode: "forwards",
    animationTimingFunction: transition?.ease ? String(transition.ease) : "ease-out",
  };

  const classes = [className, exiting ? "anim-fade-out" : "anim-fade-in"].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={classes}
      style={animStyle}
      id={id}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
      {...rest}
    >
      {children}
    </div>
  );
};

interface AnimatePresenceProps {
  mode?: "wait" | "pop";
  children: React.ReactNode;
}

export const AnimatePresenceReplace: React.FC<AnimatePresenceProps> = ({ mode = "wait", children }) => {
  return <>{children}</>;
};

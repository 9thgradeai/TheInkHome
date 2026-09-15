import React from "react";
import { motion as fmMotion, AnimatePresence as FmPresence } from "motion/react";
import { useReducedMotion } from "../hooks/useReducedMotion";

function stripMotionProps(props: any) {
  const { initial: _i, animate: _a, exit: _e, transition: _tr, whileHover: _wh, whileTap: _wt, ...rest } = props;
  return rest;
}

function createMotionComponent(tag: string) {
  const Comp: React.FC<any> = (props) => {
    const reduced = useReducedMotion();
    if (reduced) return React.createElement(tag, stripMotionProps(props));
    const FM: any = (fmMotion as any)[tag];
    return React.createElement(FM, props);
  };
  return Comp;
}

const cache = new Map<string, React.FC<any>>();
export const motion: any = new Proxy({} as any, {
  get(_t, tag: string) {
    if (!cache.has(tag)) cache.set(tag, createMotionComponent(tag));
    return cache.get(tag);
  },
});

export const AnimatePresence: typeof FmPresence = (props: any) => {
  const reduced = useReducedMotion();
  if (reduced) return <>{props.children}</>;
  return React.createElement(FmPresence as any, props);
};

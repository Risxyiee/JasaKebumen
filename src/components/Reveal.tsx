"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function Reveal({
  children, delay = 0, className,
}: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) {
      // If reduced motion, make visible immediately
      if (el) {
        el.classList.add("is-visible");
      }
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const target = en.target as HTMLElement;
          if (delay) {
            target.style.transitionDelay = `${delay * 1000}ms`;
          }
          target.classList.add("is-visible");
          obs.unobserve(target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, reduce]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}

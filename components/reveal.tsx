"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current; if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    document.documentElement.classList.add("motion-ready");
    const panels = [...document.querySelectorAll<HTMLElement>(".panel")];
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("panel-revealed"); observer.unobserve(entry.target); } }), { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    panels.forEach((panel, index) => { panel.style.setProperty("--reveal-delay", `${Math.min((index % 4) * 70, 210)}ms`); observer.observe(panel); });
    const ownObserver = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); ownObserver.unobserve(entry.target); } }, { threshold: 0.12 });
    ownObserver.observe(node); return () => { observer.disconnect(); ownObserver.disconnect(); };
  }, []);
  return <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

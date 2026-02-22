import { useEffect, useRef, useState } from "react";

/**
 * Bidirectional scroll-spy hook for documentation sidebar navigation.
 *
 * Tracks which section is currently visible in the viewport and returns its ID.
 * Uses a fresh IntersectionObserver (NOT useInView — which defaults to triggerOnce:true
 * and only works for one-shot animations, not bidirectional tracking).
 *
 * rootMargin '-20% 0px -70% 0px' means a section is "active" when its top
 * is in the top 30% of the viewport — feels natural for reading flow.
 */
export function useActiveSection(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const ratioMap = new Map<string, number>(sectionIds.map((id) => [id, 0]));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratioMap.set(entry.target.id, entry.intersectionRatio);
        });

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          let bestId = "";
          let bestRatio = 0;
          ratioMap.forEach((ratio, id) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          });

          if (bestId) {
            setActiveId(bestId);
          }
        }, 75);
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      clearTimeout(debounceRef.current);
      observer.disconnect();
    };
  }, [sectionIds]);

  return activeId;
}

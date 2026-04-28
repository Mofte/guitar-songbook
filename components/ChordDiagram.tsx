"use client";

import { useEffect, useRef } from "react";
import { SVGuitarChord } from "svguitar";
import type { ChordDiagram as ChordDiagramData } from "@/lib/chords";

type Props = {
  name: string;
  data: ChordDiagramData;
  size?: number;
};

export default function ChordDiagram({ name, data, size = 120 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.innerHTML = "";

    const chart = new SVGuitarChord(el);
    chart
      .configure({
        title: name,
        position: data.position ?? 1,
        fretSize: 1.2,
        strokeWidth: 1.5,
        nutWidth: 4,
        fontFamily: "inherit",
        titleFontSize: 32,
        titleBottomMargin: 5,
        color: "currentColor",
        backgroundColor: "transparent",
        fingerSize: 0.7,
        fingerColor: "currentColor",
        fingerTextColor: "white",
      })
      .chord({
        fingers: data.fingers,
        barres: data.barres,
      })
      .draw();

    return () => {
      el.innerHTML = "";
    };
  }, [name, data]);

  return (
    <div
      ref={ref}
      className="chord-diagram text-gray-900 dark:text-gray-100"
      style={{ width: size, height: size * 1.3 }}
      aria-label={`Griffbild für ${name}`}
    />
  );
}

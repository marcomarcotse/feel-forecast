import { useMemo } from "react";
import type { MoodWeather } from "@/lib/mood.functions";

type Props = { weather: MoodWeather | "idle" };

const gradients: Record<string, string> = {
  idle: "linear-gradient(160deg, var(--mood-idle-from), var(--mood-idle-to))",
  sunny: "linear-gradient(160deg, var(--mood-sunny-from), var(--mood-sunny-to))",
  rainy: "linear-gradient(180deg, var(--mood-rainy-from), var(--mood-rainy-to))",
  cloudy: "linear-gradient(180deg, var(--mood-cloudy-from), var(--mood-cloudy-to))",
  stormy: "linear-gradient(180deg, var(--mood-stormy-from), var(--mood-stormy-to))",
  rainbow:
    "linear-gradient(135deg, var(--mood-rainbow-from), var(--mood-rainbow-to))",
  calm: "linear-gradient(160deg, var(--mood-calm-from), var(--mood-calm-to))",
};

function RainDrops({ heavy = false }: { heavy?: boolean }) {
  const drops = useMemo(
    () =>
      Array.from({ length: heavy ? 90 : 60 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.7 + Math.random() * 0.8,
        opacity: 0.3 + Math.random() * 0.5,
        height: 12 + Math.random() * 18,
        key: i,
      })),
    [heavy],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d) => (
        <span
          key={d.key}
          style={{
            position: "absolute",
            left: `${d.left}%`,
            top: 0,
            width: 1.5,
            height: d.height,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(220,235,255,0.9))",
            opacity: d.opacity,
            animation: `rain-fall ${d.duration}s linear ${d.delay}s infinite`,
            borderRadius: 9999,
          }}
        />
      ))}
    </div>
  );
}

function Sun() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          top: "8%",
          right: "10%",
          width: 220,
          height: 220,
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, oklch(0.97 0.16 95 / 0.95), oklch(0.85 0.2 70 / 0.4) 60%, transparent 75%)",
          filter: "blur(2px)",
          animation: "float-sun 6s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function Clouds({ dark = false }: { dark?: boolean }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        top: 5 + i * 12,
        scale: 0.7 + Math.random() * 0.8,
        duration: 40 + Math.random() * 30,
        delay: -Math.random() * 40,
        key: i,
      })),
    [],
  );
  const color = dark ? "rgba(30,30,50,0.55)" : "rgba(255,255,255,0.6)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {clouds.map((c) => (
        <div
          key={c.key}
          style={{
            position: "absolute",
            top: `${c.top}%`,
            left: 0,
            width: 220,
            height: 70,
            borderRadius: 9999,
            background: color,
            filter: "blur(20px)",
            transform: `scale(${c.scale})`,
            animation: `drift ${c.duration}s linear ${c.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Rainbow() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 -bottom-40 mx-auto h-[120vh] w-[160vw]"
      style={{
        background:
          "conic-gradient(from 180deg at 50% 100%, transparent 0deg, #ff6b6b 18deg, #ffd93d 25deg, #6bcB77 32deg, #4d96ff 39deg, #b39cd0 46deg, transparent 65deg)",
        opacity: 0.35,
        borderRadius: "50%",
        filter: "blur(8px)",
      }}
    />
  );
}

export function WeatherScene({ weather }: Props) {
  return (
    <div
      className="fixed inset-0 -z-10 transition-[background] duration-1000"
      style={{ background: gradients[weather] }}
    >
      {weather === "sunny" && <Sun />}
      {weather === "rainy" && (
        <>
          <Clouds />
          <RainDrops />
        </>
      )}
      {weather === "cloudy" && <Clouds />}
      {weather === "stormy" && (
        <>
          <Clouds dark />
          <RainDrops heavy />
        </>
      )}
      {weather === "rainbow" && (
        <>
          <Sun />
          <Rainbow />
        </>
      )}
      {weather === "calm" && <Clouds />}
    </div>
  );
}
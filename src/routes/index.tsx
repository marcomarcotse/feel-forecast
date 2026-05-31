import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { observeMoodWeather, type MoodWeather } from "@/lib/mood.functions";
import { WeatherScene } from "@/components/WeatherScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Mood Weather Station" },
      { name: "description", content: "Translate your feelings into weather. Write a diary entry and let the AI forecast your inner climate." },
      { property: "og:title", content: "AI Mood Weather Station" },
      { property: "og:description", content: "Translate your feelings into weather, with a comforting quote tailored just for you." },
    ],
  }),
  component: Index,
});

function Index() {
  const [diary, setDiary] = useState("");
  const [weather, setWeather] = useState<MoodWeather | "idle">("idle");
  const observe = useServerFn(observeMoodWeather);

  const mutation = useMutation({
    mutationFn: (text: string) => observe({ data: { diary: text } }),
    onSuccess: (data) => setWeather(data.weather),
  });

  const isDark = weather === "rainy" || weather === "stormy";

  return (
    <>
      <WeatherScene weather={weather} />
      <main
        className={`relative flex min-h-screen flex-col items-center justify-between px-4 py-10 transition-colors duration-700 ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        <header className="text-center animate-fade-up">
          <p className="text-xs uppercase tracking-[0.4em] opacity-70">Inner Climate</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-light tracking-tight">
            AI Mood Weather Station
          </h1>
        </header>

        <section className="w-full max-w-xl">
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-colors duration-700 ${
              isDark
                ? "border-white/15 bg-white/10"
                : "border-white/60 bg-white/70"
            }`}
          >
            <label
              htmlFor="diary"
              className="block text-sm font-medium opacity-80"
            >
              Today's mood diary
            </label>
            <textarea
              id="diary"
              value={diary}
              onChange={(e) => setDiary(e.target.value)}
              placeholder="How does your heart feel right now? Pour it out here..."
              rows={6}
              className={`mt-3 w-full resize-none rounded-2xl border bg-transparent p-4 text-base leading-relaxed outline-none focus:ring-2 focus:ring-offset-0 transition ${
                isDark
                  ? "border-white/20 placeholder:text-white/50 focus:ring-white/40"
                  : "border-slate-300/70 placeholder:text-slate-500 focus:ring-slate-400/60"
              }`}
            />

            <button
              type="button"
              disabled={!diary.trim() || mutation.isPending}
              onClick={() => mutation.mutate(diary.trim())}
              className="mt-5 w-full rounded-2xl bg-slate-900 px-6 py-4 text-base font-medium text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? "Reading the skies..." : "Observe Mood Weather"}
            </button>

            {mutation.isError && (
              <p className="mt-3 text-sm text-red-500">
                The forecast failed. Please try again in a moment.
              </p>
            )}

            {mutation.data && (
              <div
                key={mutation.data.mood_label}
                className="mt-6 flex items-center justify-between rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm animate-fade-up"
              >
                <span className="opacity-70">Forecast</span>
                <span className="font-medium capitalize">
                  {mutation.data.weather} · {mutation.data.mood_label}
                </span>
              </div>
            )}
          </div>
        </section>

        <footer className="max-w-xl text-center min-h-[5rem]">
          {mutation.data ? (
            <blockquote
              key={mutation.data.quote}
              className="font-serif text-lg sm:text-xl italic leading-relaxed animate-fade-up"
            >
              &ldquo;{mutation.data.quote}&rdquo;
            </blockquote>
          ) : (
            <p className="text-sm opacity-60">
              A comforting quote will appear here after the forecast.
            </p>
          )}
        </footer>
      </main>
    </>
  );
}

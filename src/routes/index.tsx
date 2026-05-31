import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { observeMoodWeather, fetchMoodEntries } from "@/lib/mood.functions";
import {
  SENTIMENT_EMOJI,
  sentimentToWeather,
  type MoodEntry,
  type MoodWeather,
  type Sentiment,
} from "@/lib/mood";
import { WeatherScene } from "@/components/WeatherScene";
import { CloudSun, History, LineChart as LineChartIcon, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

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

type View = "today" | "history" | "analytics";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Index() {
  const [view, setView] = useState<View>("today");
  const [diary, setDiary] = useState("");
  const [weather, setWeather] = useState<MoodWeather | "idle">("idle");
  const observe = useServerFn(observeMoodWeather);
  const fetchEntries = useServerFn(fetchMoodEntries);
  const qc = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["mood-entries"],
    queryFn: () => fetchEntries(),
  });

  const mutation = useMutation({
    mutationFn: (text: string) => observe({ data: { diary: text } }),
    onSuccess: (entry) => {
      setWeather(sentimentToWeather(entry.sentiment));
      qc.setQueryData<MoodEntry[]>(["mood-entries"], (prev) =>
        prev ? [entry, ...prev] : [entry],
      );
    },
  });

  const isDark = weather === "rainy" || weather === "stormy";
  const textCls = isDark ? "text-white" : "text-slate-900";

  return (
    <>
      <WeatherScene weather={weather} />
      <div
        className={`relative min-h-screen transition-colors duration-700 ${textCls}`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:p-8">
          <Sidebar view={view} onChange={setView} isDark={isDark} />
          <main className="flex-1 min-w-0">
            {view === "today" && (
              <TodayView
                diary={diary}
                setDiary={setDiary}
                isDark={isDark}
                mutation={mutation}
              />
            )}
            {view === "history" && (
              <HistoryView
                logs={historyQuery.data ?? []}
                isLoading={historyQuery.isLoading}
                isDark={isDark}
              />
            )}
            {view === "analytics" && (
              <AnalyticsView logs={historyQuery.data ?? []} isDark={isDark} />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function Sidebar({
  view,
  onChange,
  isDark,
}: {
  view: View;
  onChange: (v: View) => void;
  isDark: boolean;
}) {
  const items: { id: View; label: string; icon: typeof CloudSun }[] = [
    { id: "today", label: "Today's Mood", icon: CloudSun },
    { id: "history", label: "History Logs", icon: History },
    { id: "analytics", label: "Analytics", icon: LineChartIcon },
  ];
  const shell = isDark ? "glass-dark" : "glass";
  return (
    <aside
      className={`${shell} h-fit rounded-3xl p-4 lg:w-64 lg:sticky lg:top-8 animate-fade-up`}
    >
      <div className="flex items-center gap-2 px-2 pb-4">
        <Sparkles className="size-5 opacity-80" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">
            Inner Climate
          </p>
          <h1 className="font-serif text-base font-light leading-tight">
            Mood Station
          </h1>
        </div>
      </div>
      <nav className="flex flex-row gap-1 lg:flex-col">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`group flex flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 lg:flex-none ${
                active
                  ? isDark
                    ? "bg-white/15 text-white shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
                    : "bg-white/60 text-slate-900 shadow-[0_0_25px_-5px_rgba(255,255,255,0.9)]"
                  : "opacity-70 hover:opacity-100 hover:bg-white/10"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function GlassCard({
  children,
  isDark,
  className = "",
}: {
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${isDark ? "glass-dark" : "glass"} rounded-3xl transition-colors duration-700 ${className}`}
    >
      {children}
    </div>
  );
}

function TodayView({
  diary,
  setDiary,
  isDark,
  mutation,
}: {
  diary: string;
  setDiary: (s: string) => void;
  isDark: boolean;
  mutation: ReturnType<typeof useMutation<Awaited<ReturnType<typeof observeMoodWeather>>, Error, string>>;
}) {
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] opacity-70">Today</p>
        <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-light tracking-tight">
          How does your heart feel?
        </h2>
      </header>

      <GlassCard isDark={isDark} className="p-6 sm:p-8">
        <label htmlFor="diary" className="block text-sm font-medium opacity-80">
          Today's mood diary
        </label>
        <textarea
          id="diary"
          value={diary}
          onChange={(e) => setDiary(e.target.value)}
          placeholder="Pour it out here. Whatever's true right now."
          rows={6}
          className={`mt-3 w-full resize-none rounded-2xl border bg-transparent p-4 text-base leading-relaxed outline-none focus:ring-2 transition ${
            isDark
              ? "border-white/20 placeholder:text-white/50 focus:ring-white/40"
              : "border-white/60 placeholder:text-slate-500/80 focus:ring-slate-400/60"
          }`}
        />
        <button
          type="button"
          disabled={!diary.trim() || mutation.isPending}
          onClick={() => mutation.mutate(diary.trim())}
          className="glow-primary mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-base font-medium text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Reading the skies..." : "Observe Mood Weather"}
        </button>

        {mutation.isError && (
          <p className="mt-3 text-sm text-red-400">
            The forecast failed. Please try again in a moment.
          </p>
        )}

        {mutation.data && (
          <div
            key={mutation.data.mood_label}
            className="mt-6 flex items-center justify-between rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm animate-fade-up"
          >
            <span className="opacity-70">Forecast</span>
            <span className="font-medium capitalize">
              {mutation.data.weather} · {mutation.data.mood_label}
            </span>
          </div>
        )}
      </GlassCard>

      <GlassCard isDark={isDark} className="p-6 sm:p-8 text-center min-h-[7rem] flex items-center justify-center">
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
      </GlassCard>
    </div>
  );
}

const WEATHER_EMOJI: Record<MoodWeather, string> = {
  sunny: "☀️",
  rainy: "🌧️",
  cloudy: "☁️",
  stormy: "⛈️",
  rainbow: "🌈",
  calm: "🌿",
};

function HistoryView({ logs, isDark }: { logs: LogEntry[]; isDark: boolean }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] opacity-70">Archive</p>
        <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-light tracking-tight">
          History Logs
        </h2>
      </header>
      <div className="space-y-4">
        {logs.map((log) => (
          <GlassCard key={log.id} isDark={isDark} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{WEATHER_EMOJI[log.weather]}</span>
                <div>
                  <p className="text-sm font-medium capitalize">
                    {log.weather} · {log.mood_label}
                  </p>
                  <p className="text-xs opacity-60">{log.date}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed opacity-90">{log.diary}</p>
            <blockquote className="mt-4 border-l-2 border-white/40 pl-4 font-serif text-sm italic opacity-80">
              &ldquo;{log.quote}&rdquo;
            </blockquote>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.9)";
  const grid = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const avg =
    TREND_DATA.reduce((s, d) => s + d.score, 0) / TREND_DATA.length;
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] opacity-70">Insights</p>
        <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-light tracking-tight">
          7-Day Mood Trend
        </h2>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard isDark={isDark} className="p-5">
          <p className="text-xs uppercase tracking-widest opacity-60">Average</p>
          <p className="mt-2 font-serif text-3xl">{avg.toFixed(2)}</p>
        </GlassCard>
        <GlassCard isDark={isDark} className="p-5">
          <p className="text-xs uppercase tracking-widest opacity-60">Brightest</p>
          <p className="mt-2 font-serif text-3xl">☀️ Sun</p>
        </GlassCard>
        <GlassCard isDark={isDark} className="p-5">
          <p className="text-xs uppercase tracking-widest opacity-60">Heaviest</p>
          <p className="mt-2 font-serif text-3xl">⛈️ Thu</p>
        </GlassCard>
      </div>

      <GlassCard isDark={isDark} className="p-5 sm:p-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="moodLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="50%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="day" stroke={stroke} tick={{ fill: stroke, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                stroke={stroke}
                tick={{ fill: stroke, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(20,20,40,0.85)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  color: "white",
                  backdropFilter: "blur(10px)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                formatter={(value: number, _n, p) => [
                  `${value} · ${p.payload.mood}`,
                  "Sentiment",
                ]}
              />
              <ReferenceLine y={0} stroke={grid} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#moodLine)"
                strokeWidth={3}
                dot={{ r: 5, fill: "#fff", stroke: "#a78bfa", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-xs opacity-60">
          Sunny = 1 · Rainbow = 0.8 · Calm = 0.5 · Cloudy = 0 · Rainy = −0.5 · Stormy = −1
        </p>
      </GlassCard>
    </div>
  );
}

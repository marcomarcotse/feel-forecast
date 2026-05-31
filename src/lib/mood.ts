// Client-safe shared types & helpers for the mood feature.
// Do NOT import from this file's server-only counterpart (mood.functions.ts)
// here — keep this module free of server-only dependencies.

export type Sentiment = "Sunny" | "Cloudy" | "Rainy" | "Snowy";

export type MoodWeather =
  | "sunny"
  | "rainy"
  | "cloudy"
  | "stormy"
  | "rainbow"
  | "calm";

export type MoodEntry = {
  id: string;
  user_id: string | null;
  mood_text: string;
  sentiment: Sentiment;
  sentiment_score: number;
  ai_response: string;
  created_at: string;
};

export function sentimentToWeather(s: Sentiment): MoodWeather {
  switch (s) {
    case "Sunny":
      return "sunny";
    case "Cloudy":
      return "cloudy";
    case "Rainy":
      return "rainy";
    case "Snowy":
      return "calm";
  }
}

export const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  Sunny: "☀️",
  Cloudy: "☁️",
  Rainy: "🌧️",
  Snowy: "❄️",
};
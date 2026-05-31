import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { MoodEntry } from "./mood";

const AnalysisSchema = z.object({
  sentiment: z.enum(["Sunny", "Cloudy", "Rainy", "Snowy"]),
  sentiment_score: z.number().min(-1).max(1),
  ai_response: z.string().min(1).max(600),
});

export const observeMoodWeather = createServerFn({ method: "POST" })
  .inputValidator(z.object({ diary: z.string().min(1).max(4000) }))
  .handler(async ({ data }): Promise<MoodEntry> => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("Missing OPENROUTER_API_KEY");

    const systemPrompt = `你是一位溫暖的心情天氣分析師。請仔細閱讀使用者的日記，並僅以 JSON 回應（不要包含任何 markdown 或多餘文字）。
JSON 結構：
{
  "sentiment": "Sunny" | "Cloudy" | "Rainy" | "Snowy",
  "sentiment_score": -1 到 1 之間的數字（Sunny ≈ 1、Cloudy ≈ 0、Rainy ≈ -0.5、Snowy ≈ -1）,
  "ai_response": "一段以繁體中文寫成、溫暖且鼓勵人心的回覆，30~80 字，使用第二人稱、語氣柔和。"
}
對應規則：開心/感恩 → Sunny；不安/迷惘 → Cloudy；悲傷/失落 → Rainy；孤獨/冰冷/麻木 → Snowy。`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.diary },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${errText}`);
    }

    const payload = await res.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "";
    let parsed: z.infer<typeof AnalysisSchema>;
    try {
      // Some models wrap JSON in code fences; strip them defensively.
      const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      parsed = AnalysisSchema.parse(JSON.parse(cleaned));
    } catch (err) {
      throw new Error(`Failed to parse AI response: ${content.slice(0, 200)}`);
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("mood_entries")
      .insert({
        mood_text: data.diary,
        sentiment: parsed.sentiment,
        sentiment_score: parsed.sentiment_score,
        ai_response: parsed.ai_response,
      })
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to save mood entry: ${error?.message ?? "unknown"}`);
    }

    return inserted as MoodEntry;
  });

export const fetchMoodEntries = createServerFn({ method: "GET" })
  .handler(async (): Promise<MoodEntry[]> => {
    const { data, error } = await supabaseAdmin
      .from("mood_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as MoodEntry[];
  });
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type MoodWeather = "sunny" | "rainy" | "cloudy" | "stormy" | "rainbow" | "calm";

export const observeMoodWeather = createServerFn({ method: "POST" })
  .inputValidator(z.object({ diary: z.string().min(1).max(4000) }))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          weather: z.enum(["sunny", "rainy", "cloudy", "stormy", "rainbow", "calm"]),
          mood_label: z.string(),
          quote: z.string(),
        }),
      }),
      prompt: `You are an emotional weather forecaster. Read the diary entry below and respond with:
- weather: one of sunny (happy/joyful), rainy (sad/melancholy), cloudy (uncertain/anxious), stormy (angry/frustrated), rainbow (hopeful/grateful), calm (peaceful/content).
- mood_label: 2-4 words describing the mood.
- quote: ONE warm, comforting, original quote (max 30 words) tailored to this diary. Speak gently in second person.

Diary:
"""${data.diary}"""`,
    });

    return output;
  });
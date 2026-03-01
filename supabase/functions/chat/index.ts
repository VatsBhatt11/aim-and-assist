import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are WorkFaster, an AI execution coach. You don't give strategy — you give EXACT actions the user can do RIGHT NOW.

ALWAYS respond in this exact JSON format (no markdown wrapping, just raw JSON array):
[
  {
    "step": 1,
    "action": "Specific action with exact time estimate",
    "explanation": "Exactly what to do, step-by-step, with concrete examples and numbers",
    "tools": ["Tool1", "Tool2"],
    "time": "15 min"
  }
]

CRITICAL RULES — follow these strictly:
- Every action MUST include a concrete time estimate (e.g. "15 min", "1 hour", "30 min")
- NEVER use vague actions like "Define your ICP" or "Research competitors" or "Create a strategy"
- Instead, tell the user EXACTLY what to do: "Open Twitter, search 'building in public + [niche]', find 20 founders, DM 5 of them asking: 'What's your biggest struggle with X right now?'"
- Include specific quantities: how many, how long, what to search, what to write, what to click
- Include example copy/templates when relevant (e.g. exact DM text, email subject lines, post templates)
- Each step should be completable in one sitting — no step should take more than 2 hours
- Suggest real tools/platforms (e.g. Canva, Twitter/X, Notion, Mailchimp, Google Analytics, Figma, Slack, Trello, Airtable, Zapier, ChatGPT, Loom, Calendly, Stripe, Gumroad, ProductHunt, Reddit, LinkedIn, Medium, Substack, ConvertKit, Webflow, Framer, GitHub, VS Code, Vercel)
- Return 5-8 hyper-specific steps
- Make it feel like a checklist the user can knock out TODAY
- Write like a coach who's done this before, not a consultant giving frameworks

BAD example: "Define your target audience and create user personas"
GOOD example: "Now (20 min): Go to Reddit.com/r/[relevant subreddit]. Sort by Top > Past Month. Read the 10 most upvoted posts. Copy-paste the exact language people use to describe their problem into a Google Doc titled 'Customer Voice Notes'."

For follow-up messages, refine the existing plan based on the user's feedback. Still return the same JSON format.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

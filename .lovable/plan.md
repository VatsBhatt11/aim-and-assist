

# WorkFaster MVP — AI Execution Planner

A clean chat interface where users type a goal and get a structured, actionable step-by-step plan with tool suggestions.

## Pages

### 1. Landing / Chat Page (single page app)
- **Hero area** at top: WorkFaster logo/name, tagline "Turn your goal into a clear action plan"
- **Goal input**: Large centered input field with placeholder like "What do you want to achieve?" and a send button
- Once submitted, transitions into a chat-style view

### 2. Chat / Results View
- **User's goal** displayed as a chat bubble
- **AI response** streamed in real-time as a structured plan:
  - Each step shown as a numbered card with:
    - **Action** — what to do
    - **Explanation** — why it matters
    - **Suggested tools** — shown as small badges/chips (predefined tool suggestions like "Canva", "Twitter/X", "Mailchimp", etc.)
- User can type follow-up messages to refine the plan
- Clean, minimal dark or light theme

## AI Integration
- Uses Lovable AI (Gemini) via a Supabase edge function
- System prompt crafted to always return structured step-by-step plans with actions, explanations, and tool suggestions
- Streaming responses for real-time feel

## Design
- Minimal, modern, clean UI
- Dark background with card-based step layout
- Smooth animations as steps appear
- Mobile-responsive

## Tech
- Lovable Cloud for the edge function
- Lovable AI gateway for AI responses
- No auth, no database — pure chat interaction


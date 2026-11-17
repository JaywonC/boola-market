import { redactSecrets } from "@/features/assistant/redact";

const ENDPOINT = "https://api.x.ai/v1/chat/completions";

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

/**
 * Calls the xAI chat completions API. The key is an argument from the server
 * action. This file does not read the environment and does not log the request.
 */
export async function completeGrok(input: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: input.messages,
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return { ok: false, error: "Grok didn’t respond. Check the network and try again." };
  }

  if (!response.ok) {
    // Ignore the body. Error payloads must not be returned or logged; they can echo a key.
    return { ok: false, error: "Grok couldn’t draft this listing. Try again in a moment." };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: "Grok returned something that wasn’t a listing. Try again." };
  }

  const content = readContent(payload);
  if (!content) {
    return { ok: false, error: "Grok returned an empty draft. Try again." };
  }
  return { ok: true, content: redactSecrets(content, [input.apiKey]) };
}

function readContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices.length) return "";
  const message = (choices[0] as { message?: { content?: unknown } }).message;
  const content = message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("");
}

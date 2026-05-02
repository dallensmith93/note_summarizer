import { NOTE_SUMMARY_PROMPT } from "../../src/ai/notePrompt";
import { normalizeSummaryOutput, type NoteSummaryRequest } from "../../src/ai/noteProvider";

interface OpenAiMessage {
  role: "system" | "user";
  content: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const provider = process.env.AI_PROVIDER ?? "openai";
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (provider !== "openai") {
    return new Response("Only AI_PROVIDER=openai is currently implemented.", { status: 400 });
  }

  if (!apiKey) {
    return new Response("OPENAI_API_KEY is not configured on the server.", { status: 400 });
  }

  let payload: NoteSummaryRequest;
  try {
    payload = (await request.json()) as NoteSummaryRequest;
  } catch {
    return new Response("Invalid JSON request body.", { status: 400 });
  }

  const messages: OpenAiMessage[] = [
    {
      role: "system",
      content: NOTE_SUMMARY_PROMPT
    },
    {
      role: "user",
      content: JSON.stringify(payload)
    }
  ];

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages
    })
  });

  if (!openAiResponse.ok) {
    const text = await openAiResponse.text();
    return new Response(text || "OpenAI request failed.", { status: openAiResponse.status });
  }

  const data = (await openAiResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return new Response("OpenAI did not return content.", { status: 502 });
  }

  try {
    return Response.json(normalizeSummaryOutput(JSON.parse(content)));
  } catch {
    return new Response("OpenAI returned non-JSON content.", { status: 502 });
  }
}

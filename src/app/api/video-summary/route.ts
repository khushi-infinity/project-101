import type { NextRequest } from "next/server";

async function extractPageText(url: string) {
  try {
    const r = await fetch(`https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`, { cache: "no-store" });
    if (!r.ok) return "";
    return await r.text();
  } catch {
    return "";
  }
}

function extractSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function cleanDescription(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/#[\w-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(text: string, limit = 8) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .reduce<string[]>((acc, w) => (acc.includes(w) ? acc : [...acc, w]), [])
    .slice(0, limit);
}

function summarizeText(text: string, topicQuery = "", maxSentences = 3) {
  const cleaned = cleanDescription(text);
  const sentences = extractSentences(cleaned);
  if (!sentences.length) return "No extractable text found to summarize.";

  const keywords = extractKeywords(topicQuery || text, 10);

  // Score sentences by keyword overlap and position
  const scored = sentences.map((s, idx) => {
    const words = s.toLowerCase().split(/[^a-z0-9]+/);
    const overlap = words.reduce((n, w) => n + (keywords.includes(w) ? 1 : 0), 0);
    const score = overlap * 2 + Math.max(0, 1 / (idx + 1));
    return { s, idx, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored.slice(0, maxSentences).sort((a, b) => a.idx - b.idx).map((x) => x.s);

  return chosen.join(" ");
}

function buildStructuredSummary(input: {
  title: string;
  author: string;
  description: string;
  topicQuery: string;
}) {
  const { title, author, description, topicQuery } = input;
  const summaryBody = summarizeText(description || `${title} ${topicQuery}`, topicQuery, 3);

  if (summaryBody === "No extractable text found to summarize.") {
    return `This video, ${title}, by ${author || "the creator"}, is relevant to ${topicQuery}. Watch it for a focused explanation and then validate your understanding with the quiz.`;
  }

  return `Video focus: ${title}. ${summaryBody}`;
}

async function fetchVideoMetadata(videoId: string) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const metadata: { title: string; author: string; description: string } = {
    title: "",
    author: "",
    description: "",
  };

  // Try Invidious-compatible endpoint first for description-quality text
  try {
    const yResp = await fetch(`https://y.com.sb/api/v1/videos/${videoId}`, { cache: "no-store" });
    if (yResp.ok) {
      const yData = (await yResp.json()) as {
        title?: string;
        author?: string;
        description?: string;
      };
      metadata.title = yData.title || metadata.title;
      metadata.author = yData.author || metadata.author;
      metadata.description = yData.description || metadata.description;
    }
  } catch {
    // ignore
  }

  // Then enrich with YouTube oEmbed metadata
  try {
    const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`, {
      cache: "no-store",
    });
    if (oembed.ok) {
      const oData = (await oembed.json()) as { title?: string; author_name?: string };
      metadata.title = metadata.title || oData.title || "";
      metadata.author = metadata.author || oData.author_name || "";
    }
  } catch {
    // ignore
  }

  // Final fallback if description still missing
  if (!metadata.description) {
    const pageText = await extractPageText(videoUrl);
    metadata.description = pageText;
  }

  return metadata;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, topicQuery } = body as { videoId?: string; topicQuery?: string };
    if (!videoId) return new Response(JSON.stringify({ error: "missing videoId" }), { status: 400 });

    const metadata = await fetchVideoMetadata(videoId);
    const summary = buildStructuredSummary({
      title: metadata.title || `YouTube video ${videoId}`,
      author: metadata.author || "creator",
      description: metadata.description || "",
      topicQuery: topicQuery || "this topic",
    });

    return new Response(JSON.stringify({ summary }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

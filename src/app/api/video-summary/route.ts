import type { NextRequest } from "next/server";
import { buildYouTubeSummarySections, fetchYouTubeVideoMetadata } from "@/lib/youtube";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, topicQuery } = body as { videoId?: string; topicQuery?: string };
    if (!videoId) return new Response(JSON.stringify({ error: "missing videoId" }), { status: 400 });

    const metadata = await fetchYouTubeVideoMetadata(videoId);
    const summary = buildYouTubeSummarySections({
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

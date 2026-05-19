"use client";

import { useState } from "react";

type VideoOption = {
  videoId: string;
  title: string;
  author: string;
  url: string;
  summary: string;
  viewCountText: string;
};

type Props = {
  videos: VideoOption[];
  topicQuery?: string;
};

export default function VideoSummaryClient({ videos, topicQuery = "" }: Props) {
  const initialId = videos[0]?.videoId || "";
  const [selectedVideoId, setSelectedVideoId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>(videos[0]?.summary || "Select a video and generate a summary.");
  const [error, setError] = useState<string | null>(null);

  const selectedVideo = videos.find((video) => video.videoId === selectedVideoId) || videos[0] || null;

  async function generate() {
    if (!selectedVideo) {
      setError("No recommended video available for this topic yet.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/video-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: selectedVideo.videoId, topicQuery }),
      });
      const data = await res.json();
      if (data?.summary) setSummary(data.summary);
      else setError(data?.error || "No summary returned");
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Select recommended video</label>
      <select
        value={selectedVideoId}
        onChange={(event) => {
          const nextId = event.target.value;
          setSelectedVideoId(nextId);
          const nextVideo = videos.find((video) => video.videoId === nextId);
          setSummary(nextVideo?.summary || "Select a video and generate a summary.");
          setError(null);
        }}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
      >
        {videos.map((video) => (
          <option key={video.videoId} value={video.videoId}>
            {video.title}
          </option>
        ))}
      </select>

      {selectedVideo && (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {selectedVideo.author} • {selectedVideo.viewCountText}
        </p>
      )}

      <p className="mt-3 text-sm leading-7 text-slate-600">{summary}</p>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {loading ? "Generating..." : "Generate summary"}
        </button>
        {selectedVideo && (
          <a
            href={selectedVideo.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Open video
          </a>
        )}
      </div>
    </div>
  );
}

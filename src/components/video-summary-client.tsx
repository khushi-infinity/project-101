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

type SummaryData = {
  title: string;
  overview: string;
  keyPoints: string[];
  watchFor: string[];
  whyItMatters: string;
  sourceTitle: string;
  sourceAuthor: string;
};

type Props = {
  videos: VideoOption[];
  topicQuery?: string;
};

export default function VideoSummaryClient({ videos, topicQuery = "" }: Props) {
  const initialId = videos[0]?.videoId || "";
  const [selectedVideoId, setSelectedVideoId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const hasVideos = videos.length > 0;

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
      if (data?.summary) {
        setSummary(data.summary as SummaryData);
        setIsSummaryOpen(true);
      }
      else setError(data?.error || "No summary returned");
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {isSummaryOpen && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <button
              type="button"
              onClick={() => setIsSummaryOpen(false)}
              className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">Video Summary</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">{summary.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {summary.sourceAuthor} • {summary.sourceTitle}
            </p>

            <div className="mt-6 space-y-6">
              <section>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Overview</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{summary.overview}</p>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Key Points</p>
                <ul className="mt-3 space-y-2">
                  {summary.keyPoints.map((point) => (
                    <li key={point} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Watch For</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {summary.watchFor.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Why It Matters</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{summary.whyItMatters}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {!hasVideos && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No recommended videos are available yet. Try the YouTube search below while the recommendations are rebuilding.
          <div className="mt-3">
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topicQuery)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Open YouTube search
            </a>
          </div>
        </div>
      )}

      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Select recommended video</label>
      <select
        value={selectedVideoId}
        disabled={!hasVideos}
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

      <p className="mt-3 text-sm leading-7 text-slate-600">
        Click generate summary to open a structured summary popup for the selected video.
      </p>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading || !hasVideos}
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

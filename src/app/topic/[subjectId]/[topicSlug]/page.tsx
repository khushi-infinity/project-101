import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTopicContent } from "@/lib/topic-content";
import { TopicStudyClient } from "@/components/topic-study-client";
import VideoSummaryClient from "@/components/video-summary-client";
import ResourceListPopupClient from "@/components/resource-list-popup-client";

type TopicPageProps = {
  params: Promise<{
    subjectId: string;
    topicSlug: string;
  }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const { subjectId, topicSlug } = await params;
  const topic = await getTopicContent(subjectId, topicSlug);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eff6ff,_#ffffff_40%,_#f8fafc_100%)] px-4 py-6 text-slate-800 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">Topic Detail</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">{topic.topicTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{topic.subjectTitle}</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="mt-8 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Best Videos</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Relevant videos for the topics</h2>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {topic.youtubeVideos.length ? (
              topic.youtubeVideos.map((video) => (
                <a
                  key={video.videoId}
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-[360px] max-w-[360px] shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-1"
                >
                  <div className="relative h-52 bg-slate-100">
                    <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">
                      {video.viewCountText}
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                      {formatDuration(video.lengthSeconds)}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-slate-900">{video.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{video.author}</p>
                  </div>
                </a>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                No video results returned for this topic yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">Video Summary</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Select one recommended video and click generate summary.
          </p>
          <div className="mt-4">
            <VideoSummaryClient
              videos={topic.youtubeVideos.map((video) => ({
                videoId: video.videoId,
                title: video.title,
                author: video.author,
                url: video.url,
                summary: video.summary,
                viewCountText: video.viewCountText,
              }))}
              topicQuery={`${topic.subjectTitle} ${topic.topicTitle}`}
            />
          </div>
        </section>

        <section className="mt-8">
          <ResourceListPopupClient readingResources={topic.readingResources} />
        </section>

        <TopicStudyClient topic={{ quizBank: topic.quizBank }} />
      </div>
    </main>
  );
}

function formatDuration(lengthSeconds: number) {
  if (!lengthSeconds) return "";

  const minutes = Math.floor(lengthSeconds / 60);
  const seconds = lengthSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

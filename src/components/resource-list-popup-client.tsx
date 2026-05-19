"use client";

import { useState } from "react";
import type { TopicContent } from "@/lib/topic-content";

type Props = {
  readingResources: TopicContent["readingResources"];
};

export default function ResourceListPopupClient({ readingResources }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Recommended Reading</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">PDFs, books, and extra links</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          View more
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">PDFs</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{readingResources.pdfs.length}</p>
        </div>
        <div className="rounded-2xl bg-amber-50/70 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Books</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{readingResources.books.length}</p>
        </div>
        <div className="rounded-2xl bg-blue-50/70 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Other links</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{readingResources.others.length}</p>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-slate-900">All recommended resources</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">PDFs / Papers</p>
                <div className="mt-4 space-y-3">
                  {readingResources.pdfs.map((resource) => (
                    <a key={resource.title} href={resource.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
                      <p className="font-semibold text-slate-900">{resource.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{resource.source}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">Books</p>
                <div className="mt-4 space-y-3">
                  {readingResources.books.map((resource) => (
                    <a key={resource.title} href={resource.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50/40">
                      <p className="font-semibold text-slate-900">{resource.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{resource.source}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Other Links</p>
                <div className="mt-4 space-y-3">
                  {readingResources.others.map((resource) => (
                    <a key={resource.title} href={resource.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
                      <p className="font-semibold text-slate-900">{resource.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{resource.source}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

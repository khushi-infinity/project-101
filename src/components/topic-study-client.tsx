"use client";

import { useEffect, useMemo, useState } from "react";
import type { TopicContent, TopicDifficulty } from "@/lib/topic-content";

type TopicStudyClientProps = {
  topic: Pick<TopicContent, "quizBank">;
};

const QUESTION_COUNT_OPTIONS = [3, 4, 5, 6] as const;
const DIFFICULTY_OPTIONS: Array<TopicDifficulty | "mixed"> = ["mixed", "easy", "medium", "hard"];

function rankDifficulty(difficulty: TopicDifficulty | "mixed") {
  if (difficulty === "mixed") return 0;
  if (difficulty === "easy") return 1;
  if (difficulty === "medium") return 2;
  return 3;
}

export function TopicStudyClient({ topic }: TopicStudyClientProps) {
  const [difficulty, setDifficulty] = useState<TopicDifficulty | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState<(typeof QUESTION_COUNT_OPTIONS)[number]>(5);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const selectedQuestions = useMemo(() => {
    const filtered = topic.quizBank
      .filter((question) => difficulty === "mixed" || question.difficulty === difficulty)
      .sort((left, right) => rankDifficulty(left.difficulty) - rankDifficulty(right.difficulty));

    return filtered.slice(0, questionCount);
  }, [difficulty, questionCount, topic.quizBank]);

  useEffect(() => {
    setAnswers(selectedQuestions.map(() => ""));
    setSubmitted(false);
  }, [selectedQuestions]);

  const score = selectedQuestions.reduce((total, question, index) => {
    return total + (answers[index] === question.answer ? 1 : 0);
  }, 0);

  return (
    <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">Quiz Builder</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Choose how you want to practice</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Pick a difficulty and the number of questions you want. The quiz is generated from the topic bank, so it stays aligned with the page content.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          Check Answers
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-3">
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as TopicDifficulty | "mixed")}
            className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "mixed" ? "Mixed" : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
          Questions
          <select
            value={questionCount}
            onChange={(event) => setQuestionCount(Number(event.target.value) as (typeof QUESTION_COUNT_OPTIONS)[number])}
            className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
          >
            {QUESTION_COUNT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
          Score {score}/{selectedQuestions.length || 0}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 lg:col-span-2">
          {selectedQuestions.map((question, questionIndex) => (
            <div key={question.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {questionIndex + 1}. {question.question}
                </p>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  {question.difficulty}
                </span>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {question.options.map((option) => {
                  const isSelected = answers[questionIndex] === option;
                  const showCorrect = submitted && option === question.answer;
                  const showWrong = submitted && isSelected && option !== question.answer;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const next = [...answers];
                        next[questionIndex] = option;
                        setAnswers(next);
                      }}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        showCorrect
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : showWrong
                            ? "border-rose-400 bg-rose-50 text-rose-700"
                            : isSelected
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold">Answer:</span> {question.answer}. {question.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

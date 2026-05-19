export type TopicDifficulty = "easy" | "medium" | "hard";

export type TopicVideoCard = {
  videoId: string;
  title: string;
  author: string;
  channelUrl: string;
  thumbnailUrl: string;
  viewCount: number;
  viewCountText: string;
  lengthSeconds: number;
  publishedText: string;
  url: string;
  summary: string;
};

export type TopicPlaylistCard = {
  playlistId: string;
  title: string;
  thumbnailUrl: string;
  videoCount: number;
  url: string;
  summary: string;
};

export type TopicReadingResource = {
  title: string;
  description: string;
  url: string;
  source: string;
  resourceType: "pdf" | "book" | "other";
};

export type TopicQuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: TopicDifficulty;
};

export type TopicContent = {
  subjectTitle: string;
  topicTitle: string;
  summary: string;
  keyTakeaways: string[];
  youtubePlaylists: TopicPlaylistCard[];
  youtubeVideos: TopicVideoCard[];
  readingResources: {
    pdfs: TopicReadingResource[];
    books: TopicReadingResource[];
    others: TopicReadingResource[];
  };
  quizBank: TopicQuizQuestion[];
};

type SubjectCatalogEntry = {
  title: string;
};

const SUBJECT_CATALOG: Record<string, SubjectCatalogEntry> = {
  "1": { title: "Advanced Database Management Systems" },
  "2": { title: "GenAI Engineering" },
  "3": { title: "High Level Design 101" },
  "4": { title: "Neural Network and Intro to Computer Vision" },
};

const FALLBACK_SUMMARY =
  "A concise study summary is unavailable right now, so use the resources and quiz below to explore the topic from multiple angles.";

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeTopicQuery(topicTitle: string) {
  return topicTitle.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function cleanSubjectTitle(subjectTitle: string) {
  return subjectTitle
    .replace(/^SST\s+/i, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function extractKeywords(text: string, limit = 8) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "are",
    "into",
    "what",
    "when",
    "how",
    "why",
    "use",
    "used",
    "you",
    "your",
    "about",
    "topic",
    "page",
    "summary",
    "study",
    "lecture",
    "videos",
  ]);

  return unique(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
  ).slice(0, limit);
}

function formatViewCount(viewCount: number) {
  if (viewCount >= 1_000_000) {
    return `${(viewCount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }

  if (viewCount >= 1_000) {
    return `${Math.round(viewCount / 1_000)}K views`;
  }

  return `${viewCount} views`;
}

function formatDuration(lengthSeconds: number) {
  if (!lengthSeconds || Number.isNaN(lengthSeconds)) return "";

  const minutes = Math.floor(lengthSeconds / 60);
  const seconds = lengthSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getBestThumbnail(videoThumbnails?: Array<{ quality?: string; url?: string }>) {
  if (!videoThumbnails?.length) return "";

  const preferred = videoThumbnails.find((thumbnail) =>
    ["maxresdefault", "maxres", "sddefault", "high", "medium"].includes(thumbnail.quality ?? ""),
  );

  return preferred?.url || videoThumbnails[0]?.url || "";
}

function buildVideoSummary(video: {
  title: string;
  author: string;
  viewCountText: string;
  lengthSeconds: number;
  publishedText: string;
}, topicSummary: string) {
  const keywords = extractKeywords(`${video.title} ${topicSummary}`, 3);
  const duration = formatDuration(video.lengthSeconds);

  return [
    `This ${duration ? `${duration} ` : ""}video by ${video.author || "the creator"} focuses on ${keywords[0] || "the core topic"}.`,
    `It is a strong pick because it matches the topic summary and is popular enough to be worth prioritizing (${video.viewCountText}).`,
    video.publishedText ? `Published ${video.publishedText}, it also gives you a current explanation of the concept.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildKeyTakeaways(summary: string, topicTitle: string) {
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const keywords = extractKeywords(`${topicTitle} ${summary}`, 4);

  return unique([
    sentences[0] || `${topicTitle} is the main topic on this page.`,
    sentences[1] || `Use the top-ranked video first, then reinforce it with reading resources.`,
    keywords[0] ? `Core term: ${keywords[0]}.` : `Focus on the central ideas of ${topicTitle}.`,
    keywords[1] ? `Secondary term: ${keywords[1]}.` : `Use the quiz to test recall after reviewing the content.`,
  ]);
}

async function fetchWikipediaSummary(query: string) {
  try {
    const searchResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`,
      { cache: "no-store" },
    );

    if (!searchResponse.ok) {
      return FALLBACK_SUMMARY;
    }

    const searchData = (await searchResponse.json()) as {
      query?: { search?: Array<{ title?: string }> };
    };

    const title = searchData.query?.search?.[0]?.title;
    if (!title) {
      return FALLBACK_SUMMARY;
    }

    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { cache: "no-store" },
    );

    if (!summaryResponse.ok) {
      return FALLBACK_SUMMARY;
    }

    const summaryData = (await summaryResponse.json()) as {
      extract?: string;
      description?: string;
    };

    return summaryData.extract || summaryData.description || FALLBACK_SUMMARY;
  } catch {
    return FALLBACK_SUMMARY;
  }
}

async function fetchYoutubeCards(query: string): Promise<TopicVideoCard[]> {
  const queries = unique([query, `${query} lecture`, `${query} tutorial`, `${query} playlist`]);

  // Collect raw results per query so we can compute a simple relevance score
  const rawPerQuery = await Promise.all(
    queries.map(async (singleQuery) => {
      try {
        const response = await fetch(
          `https://y.com.sb/api/v1/search?q=${encodeURIComponent(singleQuery)}&type=video`,
          { cache: "no-store" },
        );

        if (!response.ok) return [];

        const data = (await response.json()) as Array<{
          type: string;
          title?: string;
          videoId?: string;
          author?: string;
          authorUrl?: string;
          viewCount?: number;
          viewCountText?: string;
          publishedText?: string;
          lengthSeconds?: number;
          videoThumbnails?: Array<{ quality?: string; url?: string }>;
        }>;

        return data.filter((item) => item.type === "video");
      } catch {
        return [];
      }
    }),
  );

  // Aggregate occurrences and compute a combined relevance+popularity score
  const aggregate = new Map<
    string,
    {
      item: (typeof rawPerQuery)[number][number] | null;
      freq: number;
      posScore: number;
      viewCount: number;
      viewCountText: string;
    }
  >();

  for (let qIndex = 0; qIndex < rawPerQuery.length; qIndex++) {
    const list = rawPerQuery[qIndex] || [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (!it.videoId) continue;

      const entry = aggregate.get(it.videoId) ?? { item: it, freq: 0, posScore: 0, viewCount: it.viewCount || 0, viewCountText: it.viewCountText || formatViewCount(it.viewCount || 0) };
      entry.freq += 1;
      // Add a small positional boost for earlier positions
      entry.posScore += 1 / (i + 1);
      // prefer the largest viewCount seen
      entry.viewCount = Math.max(entry.viewCount || 0, it.viewCount || 0);
      entry.viewCountText = entry.viewCountText || it.viewCountText || formatViewCount(entry.viewCount || 0);
      aggregate.set(it.videoId, entry);
    }
  }

  const scored: Array<{ id: string; score: number; card: TopicVideoCard }> = [];

  for (const [id, meta] of aggregate.entries()) {
    if (!meta.item) continue;
    const it = meta.item;
    // Relevance score based on frequency and positional score
    const relevanceScore = meta.freq * 1.5 + meta.posScore;
    // Popularity score using a log scale so views don't dominate
    const popularityScore = Math.log10((meta.viewCount || 0) + 1);
    const combined = relevanceScore * 2 + popularityScore;

    const card = {
      videoId: it.videoId || id,
      title: it.title || "Untitled",
      author: it.author || "YouTube",
      channelUrl: it.authorUrl ? `https://www.youtube.com${it.authorUrl}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      thumbnailUrl: getBestThumbnail(it.videoThumbnails),
      viewCount: meta.viewCount || 0,
      viewCountText: meta.viewCountText || formatViewCount(meta.viewCount || 0),
      lengthSeconds: it.lengthSeconds || 0,
      publishedText: it.publishedText || "",
      url: `https://www.youtube.com/watch?v=${it.videoId}`,
      summary: buildVideoSummary(
        {
          title: it.title || "",
          author: it.author || "YouTube",
          viewCountText: meta.viewCountText || formatViewCount(meta.viewCount || 0),
          lengthSeconds: it.lengthSeconds || 0,
          publishedText: it.publishedText || "",
        },
        query,
      ),
    } satisfies TopicVideoCard;

    scored.push({ id, score: combined, card });
  }

  // Sort by combined score (relevance first, then popularity via combined metric)
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((s) => s.card);
}

async function fetchYoutubePlaylists(query: string): Promise<TopicPlaylistCard[]> {
  try {
    const response = await fetch(
      `https://y.com.sb/api/v1/search?q=${encodeURIComponent(query)}&type=playlist`,
      { cache: "no-store" },
    );

    if (!response.ok) return [];

    const data = (await response.json()) as Array<{
      type: string;
      title?: string;
      playlistId?: string;
      playlistThumbnail?: string;
      videoCount?: number;
    }>;

    return data
      .filter((item) => item.type === "playlist" && item.playlistId && item.title)
      .slice(0, 3)
      .map((item) => ({
        playlistId: item.playlistId ?? "",
        title: item.title ?? query,
        thumbnailUrl: item.playlistThumbnail || "",
        videoCount: item.videoCount && item.videoCount > 0 ? item.videoCount : 0,
        url: `https://www.youtube.com/playlist?list=${item.playlistId}`,
        summary: `A playlist that groups multiple explanations for ${query} into one watchlist.`,
      }));
  } catch {
    return [];
  }
}

async function fetchGoogleBooks(query: string): Promise<TopicReadingResource[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6`,
      { cache: "no-store" },
    );

    if (!response.ok) return [];

    const data = (await response.json()) as {
      items?: Array<{
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          infoLink?: string;
          previewLink?: string;
          averageRating?: number;
          ratingsCount?: number;
        };
      }>;
    };

    return (data.items ?? [])
      .map((item) => item.volumeInfo)
      .filter((volume): volume is NonNullable<typeof volume> => Boolean(volume?.title))
      .slice(0, 4)
      .map((volume) => ({
        title: volume.title ?? query,
        description: [
          volume.authors?.length ? `By ${volume.authors.slice(0, 2).join(", ")}` : "Google Books result",
          volume.averageRating ? `Rating: ${volume.averageRating}` : "",
          volume.ratingsCount ? `${volume.ratingsCount} ratings` : "",
        ]
          .filter(Boolean)
          .join(" • "),
        url: volume.previewLink || volume.infoLink || `https://www.google.com/search?q=${encodeURIComponent(`${query} book`)}`,
        source: "Google Books",
        resourceType: "book" as const,
      }));
  } catch {
    return [];
  }
}

async function fetchOpenAlexResources(query: string): Promise<TopicReadingResource[]> {
  try {
    const response = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=open_access.is_oa:true&per-page=6`,
      { cache: "no-store" },
    );

    if (!response.ok) return [];

    const data = (await response.json()) as {
      results?: Array<{
        display_name?: string;
        authorships?: Array<{ author?: { display_name?: string } }>;
        primary_location?: { pdf_url?: string; landing_page_url?: string };
        open_access?: { oa_url?: string };
        cited_by_count?: number;
        publication_year?: number;
        id?: string;
      }>;
    };

    return (data.results ?? [])
      .filter((work) => work.display_name)
      .slice(0, 4)
      .map((work) => {
        const author = work.authorships?.[0]?.author?.display_name;
        const resourceUrl = work.primary_location?.pdf_url || work.open_access?.oa_url || work.primary_location?.landing_page_url || work.id || `https://openalex.org`;

        return {
          title: work.display_name ?? query,
          description: [
            author ? `By ${author}` : "OpenAlex result",
            work.publication_year ? `Published ${work.publication_year}` : "",
            work.cited_by_count ? `${work.cited_by_count} citations` : "",
          ]
            .filter(Boolean)
            .join(" • "),
          url: resourceUrl,
          source: "OpenAlex",
          resourceType: "pdf" as const,
        } satisfies TopicReadingResource;
      });
  } catch {
    return [];
  }
}

function buildQuizBank(topicTitle: string, summary: string): TopicQuizQuestion[] {
  const keywords = extractKeywords(`${topicTitle} ${summary}`, 12);
  const mainKeyword = keywords[0] || topicTitle;
  const secondKeyword = keywords[1] || "concepts";
  const thirdKeyword = keywords[2] || "revision";

  const distractors = unique([
    ...keywords.slice(3, 6),
    "authentication",
    "frontend",
    "deployment",
    "analytics",
  ]).filter((word) => word !== mainKeyword && word !== secondKeyword && word !== thirdKeyword);

  const options = (correct: string, extras: string[]) => {
    const candidates = unique([correct, ...extras, "architecture", "design", "implementation", "system"]);
    return candidates.slice(0, 4);
  };

  const easyQuestions: TopicQuizQuestion[] = [
    {
      difficulty: "easy",
      question: `What is the main focus of ${topicTitle}?`,
      options: options(topicTitle, [mainKeyword, secondKeyword, thirdKeyword]),
      answer: topicTitle,
      explanation: `The page is centered on ${topicTitle}, so that is the best starting answer.`,
    },
    {
      difficulty: "easy",
      question: `Which keyword from the summary looks most relevant to ${topicTitle}?`,
      options: options(mainKeyword, [secondKeyword, thirdKeyword, ...distractors]),
      answer: mainKeyword,
      explanation: `The fetched summary highlights ${mainKeyword} as one of the strongest topic terms.`,
    },
    {
      difficulty: "easy",
      question: `Which of these terms is directly connected to ${topicTitle}?`,
      options: options(secondKeyword, [mainKeyword, thirdKeyword, ...distractors]),
      answer: secondKeyword,
      explanation: `${secondKeyword} appears as a key supporting idea for ${topicTitle}.`,
    },
    {
      difficulty: "easy",
      question: `What should you do first while learning ${topicTitle} on this page?`,
      options: ["Watch a relevant video first", "Skip videos and jump to quiz", "Ignore resources", "Only read one sentence"],
      answer: "Watch a relevant video first",
      explanation: "A strong video builds context before deep reading and quiz practice.",
    },
    {
      difficulty: "easy",
      question: `Which section helps you test basic recall?`,
      options: ["Quiz section", "Thumbnail section", "Navigation bar", "Channel icon"],
      answer: "Quiz section",
      explanation: "The quiz section is built exactly for recall and concept checks.",
    },
    {
      difficulty: "easy",
      question: `What is the best purpose of the generated summary?`,
      options: ["Quick understanding before detailed study", "Replacing all learning", "Skipping resources", "Memorizing random words"],
      answer: "Quick understanding before detailed study",
      explanation: "The summary gives a fast overview so deeper resources are easier to follow.",
    },
  ];

  const mediumQuestions: TopicQuizQuestion[] = [
    {
      difficulty: "medium",
      question: `Why should you start with a ranked video before reading the PDFs for ${topicTitle}?`,
      options: [
        "It gives a first-pass explanation before deeper reading",
        "It removes the need for reading entirely",
        "It replaces the quiz section",
        "It hides the books section",
      ],
      answer: "It gives a first-pass explanation before deeper reading",
      explanation: "A strong video gives you context and makes the text resources easier to absorb.",
    },
    {
      difficulty: "medium",
      question: `What is the best revision pattern for this page?`,
      options: ["Read the summary and notes", "Skip the notes section", "Only memorize one line", "Ignore the linked resources"],
      answer: "Read the summary and notes",
      explanation: "A summary plus notes gives you the fastest overview before opening deeper resources.",
    },
    {
      difficulty: "medium",
      question: `How should you combine videos and reading resources for ${topicTitle}?`,
      options: [
        "Use videos for intuition and resources for depth",
        "Use only resources and skip videos",
        "Use only videos and skip resources",
        "Do quiz first without reading anything",
      ],
      answer: "Use videos for intuition and resources for depth",
      explanation: "This gives both conceptual clarity and detailed understanding.",
    },
    {
      difficulty: "medium",
      question: `Which metric mix is best for ranking learning videos?`,
      options: ["Topic relevance and view count", "Thumbnail color only", "Random order", "Upload time only"],
      answer: "Topic relevance and view count",
      explanation: "Combining relevance and popularity improves practical quality.",
    },
    {
      difficulty: "medium",
      question: `What indicates a resource is useful for exam prep?`,
      options: ["Clear topic match and depth", "Short URL only", "Most colorful page", "Highest ad count"],
      answer: "Clear topic match and depth",
      explanation: "Good resources are aligned to the topic and explain details.",
    },
    {
      difficulty: "medium",
      question: `What is a good way to revise ${topicTitle} after first study?`,
      options: ["Retake quiz at higher difficulty", "Close the page immediately", "Ignore mistakes", "Read only headings"],
      answer: "Retake quiz at higher difficulty",
      explanation: "Increasing difficulty after basics is a strong revision pattern.",
    },
  ];

  const hardQuestions: TopicQuizQuestion[] = [
    {
      difficulty: "hard",
      question: `What should the resource ranking prioritize most for video selection?`,
      options: ["Views and topic relevance", "Random upload date only", "Channel color theme", "Thumbnail style"],
      answer: "Views and topic relevance",
      explanation: "The ranking favors relevance first and then popularity via view count so the cards stay useful.",
    },
    {
      difficulty: "hard",
      question: `Which resource type is best for deeper study after videos?`,
      options: ["PDF papers and books", "Random social posts", "Only short captions", "No resources at all"],
      answer: "PDF papers and books",
      explanation: "Formal reading resources are better for deeper study and revision after the video overview.",
    },
    {
      difficulty: "hard",
      question: `If two videos are equally relevant, what should break the tie?`,
      options: ["Higher trusted engagement signal", "Random coin toss", "Longer title", "First alphabetically"],
      answer: "Higher trusted engagement signal",
      explanation: "When relevance is equal, quality signals such as engagement are practical tie-breakers.",
    },
    {
      difficulty: "hard",
      question: `Which strategy best reduces noisy learning links?`,
      options: ["Filter by source quality and topic match", "Include every available link", "Sort by URL length", "Choose the first result only"],
      answer: "Filter by source quality and topic match",
      explanation: "Quality filtering removes irrelevant and broken resources.",
    },
    {
      difficulty: "hard",
      question: `Why is extractive video summarization sometimes weak?`,
      options: [
        "Source text can be noisy or incomplete",
        "Because summaries are always wrong",
        "Because metadata should be ignored",
        "Because keyword scoring never works",
      ],
      answer: "Source text can be noisy or incomplete",
      explanation: "Improving source quality and filters generally improves summary quality.",
    },
    {
      difficulty: "hard",
      question: `What improves precision when searching for advanced DBMS content?`,
      options: ["Use full subject phrase and topic together", "Search only DBMS", "Search only SST", "Search by random keyword"],
      answer: "Use full subject phrase and topic together",
      explanation: "Combining the full subject name with topic disambiguates broader terms.",
    },
    {
      difficulty: "hard",
      question: `For robust quiz generation, what is required per difficulty bucket?`,
      options: ["Enough question inventory for requested count", "Exactly one question", "No categorization", "Only short options"],
      answer: "Enough question inventory for requested count",
      explanation: "If each bucket has enough items, requested counts can always be satisfied.",
    },
  ];

  return [...easyQuestions, ...mediumQuestions, ...hardQuestions];
}

function buildReadingFallback(query: string): TopicReadingResource[] {
  return [
    {
      title: `OpenAlex search for ${query}`,
      description: "Open access papers and PDFs that match the topic query.",
      url: `https://openalex.org/works?search=${encodeURIComponent(query)}`,
      source: "OpenAlex",
      resourceType: "other" as const,
    },
  ];
}

function isUsableHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function resourceSeemsRelevant(resource: TopicReadingResource, keywords: string[]) {
  const hay = `${resource.title} ${resource.description}`.toLowerCase();
  return keywords.some((keyword) => hay.includes(keyword));
}

function filterReadingResources(resources: TopicReadingResource[], query: string, limit: number) {
  const keywords = extractKeywords(query, 8);
  const seen = new Set<string>();

  const filtered = resources.filter((resource) => {
    if (!isUsableHttpUrl(resource.url)) return false;
    if (!resource.title?.trim()) return false;
    if (!resourceSeemsRelevant(resource, keywords)) return false;

    const normalized = `${resource.source.toLowerCase()}::${resource.title.toLowerCase()}`;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  return filtered.slice(0, limit);
}

export async function getTopicContent(subjectId: string, topicSlug: string): Promise<TopicContent> {
  const rawSubjectTitle = SUBJECT_CATALOG[subjectId]?.title || `Subject ${subjectId}`;
  const subjectTitle = cleanSubjectTitle(rawSubjectTitle);
  const topicTitle = normalizeTopicQuery(humanizeSlug(topicSlug));
  const searchQuery = `${subjectTitle} ${topicTitle}`;

  const [summary, youtubeVideos, youtubePlaylists, books, papers] = await Promise.all([
    fetchWikipediaSummary(searchQuery),
    fetchYoutubeCards(searchQuery),
    fetchYoutubePlaylists(searchQuery),
    fetchGoogleBooks(searchQuery),
    fetchOpenAlexResources(searchQuery),
  ]);

  const filteredPapers = filterReadingResources(papers, `${searchQuery} research paper`, 4);
  const filteredBooks = filterReadingResources(books, `${searchQuery} textbook`, 4);

  const readingResources: TopicContent["readingResources"] = {
    pdfs: filteredPapers.length ? filteredPapers : papers.slice(0, 3),
    books: filteredBooks.length
      ? filteredBooks
      : books.length
      ? books
      : [
          {
            title: `Google Books search for ${topicTitle}`,
            description: "Search results for textbook-style material tied to the topic.",
            url: `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}`,
            source: "Google Books",
            resourceType: "book" as const,
          },
        ],
    others: [
      {
        title: `Wikipedia: ${topicTitle}`,
        description: "Background reading and a concise overview of the concept.",
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topicTitle)}`,
        source: "Wikipedia",
        resourceType: "other" as const,
      },
      ...buildReadingFallback(searchQuery),
    ],
  };

  return {
    subjectTitle,
    topicTitle,
    summary,
    keyTakeaways: buildKeyTakeaways(summary, topicTitle),
    youtubePlaylists,
    youtubeVideos,
    readingResources,
    quizBank: buildQuizBank(topicTitle, summary),
  } satisfies TopicContent;
}

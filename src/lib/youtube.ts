const YOUTUBE_PROXY_BASE = "https://r.jina.ai/http://www.youtube.com";

export type ParsedYouTubeSearchResult = {
  videoId: string;
  title: string;
  author: string;
  channelUrl: string;
  thumbnailUrl: string;
  viewCountText: string;
  publishedText: string;
  description: string;
  url: string;
};

export type ParsedYouTubeVideoMetadata = {
  title: string;
  author: string;
  description: string;
};

export type YouTubeSummarySections = {
  title: string;
  overview: string;
  keyPoints: string[];
  watchFor: string[];
  whyItMatters: string;
  sourceTitle: string;
  sourceAuthor: string;
};

function buildProxyUrl(path: string) {
  return `${YOUTUBE_PROXY_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function stripMarkdownLinks(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(text: string) {
  return stripMarkdownLinks(text.replace(/\r/g, "").replace(/[^\x00-\x7F]/g, " ")).replace(/\s+/g, " ").trim();
}

function extractSentences(text: string) {
  return normalizeText(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);
}

function extractKeywords(text: string, limit = 8) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .reduce<string[]>((accumulator, word) => (accumulator.includes(word) ? accumulator : [...accumulator, word]), [])
    .slice(0, limit);
}

function summarizeDescription(description: string, topicQuery: string) {
  const sentences = extractSentences(description);
  if (!sentences.length) return "";

  const keywords = extractKeywords(`${topicQuery} ${description}`, 10);

  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().split(/[^a-z0-9]+/);
    const overlap = words.reduce((count, word) => count + (keywords.includes(word) ? 1 : 0), 0);
    const score = overlap * 2 + Math.max(0, 1 / (index + 1));
    return { sentence, index, score };
  });

  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence)
    .join(" ");
}

function collectSection(lines: string[], startIndex: number) {
  const collected: string[] = [];
  const stopPatterns = [
    /^Transcript$/i,
    /^Follow along using the transcript\.?$/i,
    /^Show less$/i,
    /^Show more$/i,
    /^Read more$/i,
    /^Comments?$/i,
    /^Chapters$/i,
    /^Music \d+ songs$/i,
    /^Shorts remixing this video$/i,
    /^No views$/i,
  ];

  for (let index = startIndex; index < lines.length; index++) {
    const line = lines[index]?.trim();
    if (!line) continue;
    if (/^#{1,3}\s/.test(line) && index !== startIndex) break;
    if (stopPatterns.some((pattern) => pattern.test(line))) break;
    if (line.includes("...more")) break;
    if (/^(\[|\]|\(|\)|#+|•|\*|-)+$/i.test(line)) continue;

    collected.push(normalizeText(line));
  }

  return collected.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function firstMeaningfulSentence(text: string) {
  return extractSentences(text)[0] || "";
}

function splitKeyPoints(description: string, topicQuery: string) {
  const sentences = extractSentences(description);
  const relevant = sentences.filter((sentence) => extractKeywords(`${topicQuery} ${sentence}`, 4).length > 0);
  return (relevant.length ? relevant : sentences).slice(0, 3).map((sentence) => sentence.replace(/\s+/g, " ").trim());
}

function parseWatchPage(markdown: string): ParsedYouTubeVideoMetadata {
  const lines = markdown.split(/\r?\n/);

  const title =
    lines.find((line) => /^##\s+.+- YouTube$/i.test(line.trim()))?.replace(/^##\s+/i, "").replace(/\s+-\s+YouTube$/i, "").trim() ||
    lines.find((line) => /^Title:\s*/i.test(line.trim()))?.replace(/^Title:\s*/i, "").trim() ||
    "YouTube video";

  const descriptionStart = lines.findIndex((line) => /^##\s+Description$/i.test(line.trim()));

  const description = descriptionStart >= 0 ? collectSection(lines, descriptionStart + 1) : "";

  const author =
    lines.find((line) => /^####\s+[^#]+\s+subscribers$/i.test(line.trim()))?.replace(/^####\s+/i, "").replace(/\s+subscribers$/i, "").trim() ||
    lines.find((line) => /^\[[^\]]+\]\(http:\/\/www\.youtube\.com\/channel\//i.test(line.trim()))
      ?.replace(/^\[?([^\]]+)\]?.*$/i, "$1")
      .trim() ||
    "YouTube";

  return {
    title,
    author,
    description: normalizeText(description),
  };
}

function parseSearchBlocks(markdown: string, query: string): ParsedYouTubeSearchResult[] {
  const headerRegex = /^(#{3,4})\s+\[([^\]]+)\]\(http:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})(?:[^)]*)\)(?:\s+"[^"]*")?$/gm;
  const headers = [...markdown.matchAll(headerRegex)];
  const results: ParsedYouTubeSearchResult[] = [];

  for (let index = 0; index < headers.length; index++) {
    const current = headers[index];
    const next = headers[index + 1];
    if (!current || current.index == null) continue;

    const block = markdown.slice(current.index, next?.index ?? markdown.length);
    const rawLines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const title = normalizeText(current[2] || query);
    const videoId = current[3] || "";

    let author = "";
    let viewCountText = "";
    let publishedText = "";
    let description = "";
    let captureDescription = false;

    for (const rawLine of rawLines.slice(1)) {
      const line = normalizeText(rawLine);
      if (!line) continue;
      if (!/^[\x00-\x7F]+$/.test(line)) continue;

      if (/^From the video description$/i.test(line) || /^AI-generated video summary$/i.test(line) || /^Summary$/i.test(line)) {
        captureDescription = true;
        continue;
      }

      if (!viewCountText && /\bviews?\b/i.test(line)) {
        viewCountText = line;
        const publishedMatch = line.match(/•\s*(.+)$/);
        if (publishedMatch?.[1]) {
          publishedText = publishedMatch[1].trim();
        }
        continue;
      }

      if (!author && line.length <= 70 && !/\bviews?\b/i.test(line) && !/\bplaylist\b/i.test(line) && !/^\d+[:.]\d+/.test(line)) {
        author = line;
        continue;
      }

      if (captureDescription) {
        description = description ? `${description} ${line}` : line;
      }
    }

    results.push({
      videoId,
      title,
      author: author || "YouTube",
      channelUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      viewCountText: viewCountText || "YouTube video",
      publishedText,
      description: normalizeText(description || title),
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  const uniqueResults = new Map<string, ParsedYouTubeSearchResult>();
  for (const result of results) {
    if (!result.videoId || uniqueResults.has(result.videoId)) continue;
    uniqueResults.set(result.videoId, result);
  }

  return [...uniqueResults.values()];
}

export async function fetchYouTubeSearchResults(query: string, limit = 8): Promise<ParsedYouTubeSearchResult[]> {
  try {
    const response = await fetch(buildProxyUrl(`/results?search_query=${encodeURIComponent(query)}`), {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const markdown = await response.text();
    return parseSearchBlocks(markdown, query).slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchYouTubeVideoMetadata(videoId: string): Promise<ParsedYouTubeVideoMetadata> {
  try {
    const response = await fetch(buildProxyUrl(`/watch?v=${encodeURIComponent(videoId)}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      return { title: `YouTube video ${videoId}`, author: "YouTube", description: "" };
    }

    const markdown = await response.text();
    return parseWatchPage(markdown);
  } catch {
    return { title: `YouTube video ${videoId}`, author: "YouTube", description: "" };
  }
}

export function buildYouTubeVideoSummary(input: {
  title: string;
  author: string;
  description: string;
  topicQuery: string;
}) {
  const { title, author, description, topicQuery } = input;
  const cleanDescription = normalizeText(description);
  const overview = summarizeDescription(cleanDescription || `${title}. ${topicQuery}`, topicQuery);
  const leadSentence = firstMeaningfulSentence(overview || cleanDescription) || `This video is relevant to ${topicQuery}.`;
  const keywords = extractKeywords(`${title} ${topicQuery} ${cleanDescription}`, 4);

  const themeLine = keywords.length
    ? `Key themes: ${keywords.slice(0, 3).join(", ")}.`
    : `Key themes: ${topicQuery}.`;

  const closingLine = `Why it matters: this is a focused explanation from ${author || "the creator"} that matches the topic and is suitable as a first watch.`;

  return [
    `Video focus: ${title}`,
    leadSentence,
    themeLine,
    closingLine,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function buildYouTubeSummarySections(input: {
  title: string;
  author: string;
  description: string;
  topicQuery: string;
}): YouTubeSummarySections {
  const { title, author, description, topicQuery } = input;
  const cleanDescription = normalizeText(description);
  const overviewSource = summarizeDescription(cleanDescription || `${title}. ${topicQuery}`, topicQuery);
  const overview = overviewSource || firstMeaningfulSentence(cleanDescription) || `This video is relevant to ${topicQuery}.`;
  const keywords = extractKeywords(`${title} ${topicQuery} ${cleanDescription}`, 5);
  const keyPoints = splitKeyPoints(cleanDescription || `${title} ${topicQuery}`, topicQuery);

  return {
    title,
    overview,
    keyPoints: keyPoints.length ? keyPoints : [`Watch the video for a focused explanation of ${topicQuery}.`],
    watchFor: [
      keywords[0] ? `Look for how ${keywords[0]} is introduced.` : `Look for the main concept being defined.`,
      keywords[1] ? `Notice how ${keywords[1]} connects to the larger topic.` : `Notice which examples are used to explain the idea.`,
      `Pay attention to the reasoning and recap from ${author || "the creator"}.`,
    ],
    whyItMatters: `This is a useful first watch because it stays centered on ${topicQuery} and gives you a quick conceptual overview before deeper study.`,
    sourceTitle: title,
    sourceAuthor: author || "YouTube",
  };
}
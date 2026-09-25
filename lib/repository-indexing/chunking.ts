import type { FileType } from "@/lib/repository-indexing/file-rules";

export type ContentChunk = {
  content: string;
  startLine: number;
  endLine: number;
};

const TARGET_CHARS = 4000; // ~1000 tokens
const OVERLAP_CHARS = 600; // ~150 tokens

const DECLARATION_PATTERN =
  /^\s*(export\s+)?(default\s+)?(async\s+)?(function|class|interface|type|enum|struct|impl|def|func|public|private|protected|static|fn)\b/;

function findBreakLine(
  lines: string[],
  fromIndex: number,
  lookbackLines: number,
): number {
  const earliest = Math.max(0, fromIndex - lookbackLines);

  for (let i = fromIndex; i >= earliest; i--) {
    if (lines[i].trim() === "") {
      return i;
    }
  }

  for (let i = fromIndex; i >= earliest; i--) {
    if (DECLARATION_PATTERN.test(lines[i])) {
      return i;
    }
  }

  return fromIndex;
}

export function chunkByLines(
  content: string,
  targetChars = TARGET_CHARS,
  overlapChars = OVERLAP_CHARS,
  lookbackLines = 15,
): ContentChunk[] {
  const lines = content.split("\n");
  if (lines.length === 0 || content.length === 0) {
    return [];
  }

  const chunks: ContentChunk[] = [];
  let startIdx = 0;

  while (startIdx < lines.length) {
    let size = 0;
    let endIdx = startIdx;

    while (endIdx < lines.length && size < targetChars) {
      size += lines[endIdx].length + 1;
      endIdx++;
    }

    if (endIdx < lines.length) {
      const breakIdx = findBreakLine(lines, endIdx - 1, lookbackLines);
      if (breakIdx > startIdx) {
        endIdx = breakIdx + 1;
      }
    }

    chunks.push({
      content: lines.slice(startIdx, endIdx).join("\n"),
      startLine: startIdx + 1,
      endLine: endIdx,
    });

    if (endIdx >= lines.length) {
      break;
    }

    let overlapSize = 0;
    let nextStart = endIdx;
    while (nextStart > startIdx + 1 && overlapSize < overlapChars) {
      nextStart--;
      overlapSize += lines[nextStart].length + 1;
    }
    startIdx = nextStart;
  }

  return chunks;
}

export function chunkMarkdown(
  content: string,
  targetChars = TARGET_CHARS,
): ContentChunk[] {
  const lines = content.split("\n");
  if (lines.length === 0 || content.length === 0) {
    return [];
  }

  const headingPattern = /^#{1,6}\s/;
  const sections: { startLine: number; lines: string[] }[] = [];
  let current: string[] = [];
  let currentStart = 0;

  lines.forEach((line, idx) => {
    if (headingPattern.test(line) && current.length > 0) {
      sections.push({ startLine: currentStart + 1, lines: current });
      current = [];
      currentStart = idx;
    }
    current.push(line);
  });
  sections.push({ startLine: currentStart + 1, lines: current });

  const chunks: ContentChunk[] = [];

  for (const section of sections) {
    const text = section.lines.join("\n");
    const endLine = section.startLine + section.lines.length - 1;

    if (text.length <= targetChars) {
      chunks.push({ content: text, startLine: section.startLine, endLine });
      continue;
    }

    // Oversized section: split by paragraph groups (blank-line separated).
    let buffer: string[] = [];
    let bufferStart = section.startLine;
    let lineCursor = section.startLine;

    const flush = (throughLine: number) => {
      if (buffer.length === 0) return;
      chunks.push({
        content: buffer.join("\n").trim(),
        startLine: bufferStart,
        endLine: throughLine,
      });
      buffer = [];
    };

    let paragraphStart = section.startLine;
    let paragraphLines: string[] = [];

    for (const line of section.lines) {
      if (line.trim() === "" && paragraphLines.length > 0) {
        const paragraphText = paragraphLines.join("\n");
        const wouldExceed =
          buffer.reduce((n, l) => n + l.length + 1, 0) + paragraphText.length >
          targetChars;

        if (wouldExceed && buffer.length > 0) {
          flush(lineCursor - paragraphLines.length - 1);
          bufferStart = paragraphStart;
        }

        buffer.push(...paragraphLines, "");
        paragraphLines = [];
      } else {
        if (paragraphLines.length === 0) {
          paragraphStart = lineCursor;
        }
        paragraphLines.push(line);
      }
      lineCursor++;
    }

    if (paragraphLines.length > 0) {
      buffer.push(...paragraphLines);
    }

    flush(endLine);
  }

  return chunks;
}

export function chunkConfiguration(
  content: string,
  targetChars = TARGET_CHARS,
): ContentChunk[] {
  if (content.length === 0) {
    return [];
  }

  if (content.length <= targetChars * 1.5) {
    return [{ content, startLine: 1, endLine: content.split("\n").length }];
  }

  return chunkByLines(content, targetChars, 0);
}

export function chunkFileContent(
  fileType: FileType,
  content: string,
): ContentChunk[] {
  if (fileType === "DOCUMENTATION") {
    return chunkMarkdown(content);
  }

  if (fileType === "CONFIGURATION") {
    return chunkConfiguration(content);
  }

  return chunkByLines(content);
}

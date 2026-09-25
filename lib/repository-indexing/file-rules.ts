export type FileType = "SOURCE" | "DOCUMENTATION" | "CONFIGURATION";

export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;

export const MAX_FILES_TO_INDEX = 1000;
export const MAX_BATCH_BYTES = 400 * 1024;
export const MAX_FILES_PER_BATCH = 30;

export const IGNORED_DIRECTORIES = [
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  "vendor",
  "target",
  ".cache",
  "tmp",
];

const EXTENSION_RULES: Record<
  string,
  { language: string; fileType: FileType }
> = {
  ts: { language: "typescript", fileType: "SOURCE" },
  tsx: { language: "typescript", fileType: "SOURCE" },
  js: { language: "javascript", fileType: "SOURCE" },
  jsx: { language: "javascript", fileType: "SOURCE" },
  mjs: { language: "javascript", fileType: "SOURCE" },
  cjs: { language: "javascript", fileType: "SOURCE" },
  py: { language: "python", fileType: "SOURCE" },
  java: { language: "java", fileType: "SOURCE" },
  go: { language: "go", fileType: "SOURCE" },
  rs: { language: "rust", fileType: "SOURCE" },
  c: { language: "c", fileType: "SOURCE" },
  cpp: { language: "cpp", fileType: "SOURCE" },
  h: { language: "c", fileType: "SOURCE" },
  hpp: { language: "cpp", fileType: "SOURCE" },
  cs: { language: "csharp", fileType: "SOURCE" },
  php: { language: "php", fileType: "SOURCE" },
  rb: { language: "ruby", fileType: "SOURCE" },
  swift: { language: "swift", fileType: "SOURCE" },
  kt: { language: "kotlin", fileType: "SOURCE" },
  kts: { language: "kotlin", fileType: "SOURCE" },
  html: { language: "html", fileType: "SOURCE" },
  css: { language: "css", fileType: "SOURCE" },
  scss: { language: "scss", fileType: "SOURCE" },
  json: { language: "json", fileType: "CONFIGURATION" },
  yaml: { language: "yaml", fileType: "CONFIGURATION" },
  yml: { language: "yaml", fileType: "CONFIGURATION" },
  toml: { language: "toml", fileType: "CONFIGURATION" },
  md: { language: "markdown", fileType: "DOCUMENTATION" },
  mdx: { language: "markdown", fileType: "DOCUMENTATION" },
};

export function isIgnoredPath(relativePath: string): boolean {
  const segments = relativePath.split("/");
  return segments.some((segment) => IGNORED_DIRECTORIES.includes(segment));
}

export function getFileRule(relativePath: string) {
  const extension = relativePath.split(".").pop()?.toLowerCase();
  if (!extension) {
    return null;
  }
  return EXTENSION_RULES[extension] ?? null;
}

export function isSupportedFile(relativePath: string): boolean {
  return getFileRule(relativePath) !== null;
}

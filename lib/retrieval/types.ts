export type RetrievedChunk = {
  id: string;
  text: string;
  filePath: string;
  language: string;
  fileType: string;
  startLine: number;
  endLine: number;
  chunkIndex: number;
  score: number;
};

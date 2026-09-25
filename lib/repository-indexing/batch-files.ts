export type DiscoveredFile = {
  relativePath: string;
  size: number;
};

export function batchFiles(
  files: DiscoveredFile[],
  maxBatchBytes: number,
  maxFilesPerBatch: number,
): DiscoveredFile[][] {
  const batches: DiscoveredFile[][] = [];
  let current: DiscoveredFile[] = [];
  let currentBytes = 0;

  for (const file of files) {
    const wouldExceedBytes = currentBytes + file.size > maxBatchBytes;
    const wouldExceedCount = current.length >= maxFilesPerBatch;

    if (current.length > 0 && (wouldExceedBytes || wouldExceedCount)) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }

    current.push(file);
    currentBytes += file.size;
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

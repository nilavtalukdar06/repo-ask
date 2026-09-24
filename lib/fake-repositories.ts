export type Repository =
  | {
      id: string;
      name: string;
      status: "indexed";
      indexedAt: Date;
    }
  | {
      id: string;
      name: string;
      status: "indexing";
      progress: number;
    };

export const fakeRepositories: Repository[] = [
  {
    id: "1",
    name: "vercel/next.js",
    status: "indexed",
    indexedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    name: "openai/openai-cookbook",
    status: "indexing",
    progress: 47,
  },
];

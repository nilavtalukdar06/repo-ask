import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

export const REPOSITORIES_PAGE_SIZE = 10;
export const REPOSITORY_SEARCH_MAX_LENGTH = 100;

export const repositoriesSearchParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
};

export const loadRepositoriesSearchParams = createLoader(
  repositoriesSearchParams,
);

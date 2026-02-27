/**
 * Represents a single document indexed in the search store.
 * In a real system this would be an Elasticsearch / Meilisearch / Typesense document.
 */
export interface IndexedPost {
  id: string;
  title: string;
  /** Plain-text excerpt trimmed to 200 characters */
  excerpt: string;
  authorId: string;
  createdAt: string;
  indexedAt: string;
}

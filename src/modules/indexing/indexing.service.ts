import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { PostCreatedEvent } from './events/post-created.event';
import { IndexedPost } from './interfaces/indexed-post.interface';

@Injectable()
export class IndexingService {
    private readonly logger = new Logger(IndexingService.name);

    /**
     * Cache key prefix for indexed post documents.
     * In production, replace this in-memory approach with a real search engine
     * (Elasticsearch, Meilisearch, Typesense, etc.).
     */
    private readonly CACHE_PREFIX = 'search:post:';

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    /**
     * Indexes a newly-created post so it is searchable.
     *
     * Current implementation stores the document in Redis cache as a stand-in
     * for a real search index. Replace `this.cacheManager.set(...)` with a call
     * to your search-engine client (e.g. `elasticsearchClient.index(...)`) when
     * integrating a real engine.
     */
    async indexPost(event: PostCreatedEvent): Promise<void> {
        const { postId, title, content, authorId, createdAt } = event;

        this.logger.log(`Indexing post ${postId} by author ${authorId}`);

        const document: IndexedPost = {
            id: postId,
            title,
            // Store a 200-char plain-text excerpt (strip markdown/html in production)
            excerpt: content.slice(0, 200),
            authorId,
            createdAt,
            indexedAt: new Date().toISOString(),
        };

        const cacheKey = `${this.CACHE_PREFIX}${postId}`;

        // Store in cache (Redis-backed). TTL = 24 h.
        await this.cacheManager.set(cacheKey, document, 86_400_000);

        this.logger.log(`Post ${postId} indexed successfully`);
    }

    /**
     * Retrieves an indexed post by ID.
     * Useful for verifying the indexing step in integration tests.
     */
    async getIndexedPost(postId: string): Promise<IndexedPost | null> {
        const cacheKey = `${this.CACHE_PREFIX}${postId}`;
        return this.cacheManager.get<IndexedPost>(cacheKey);
    }
}

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { IndexingService } from 'src/modules/indexing/indexing.service';
import { PostCreatedEvent } from 'src/modules/indexing/events/post-created.event';

describe('IndexingService', () => {
    let service: IndexingService;

    const mockCacheManager = {
        set: jest.fn(),
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [IndexingService, { provide: CACHE_MANAGER, useValue: mockCacheManager }],
        }).compile();

        service = module.get<IndexingService>(IndexingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('indexPost', () => {
        const event: PostCreatedEvent = {
            postId: 'post-abc',
            title: 'My First Post',
            content: 'A'.repeat(300), // longer than 200 chars to test excerpt trimming
            authorId: 'user-xyz',
            createdAt: new Date().toISOString(),
        };

        it('should store the indexed document in cache', async () => {
            mockCacheManager.set.mockResolvedValueOnce(undefined);

            await service.indexPost(event);

            expect(mockCacheManager.set).toHaveBeenCalledWith(
                `search:post:${event.postId}`,
                expect.objectContaining({
                    id: event.postId,
                    title: event.title,
                    authorId: event.authorId,
                    createdAt: event.createdAt,
                }),
                86_400_000,
            );
        });

        it('should trim content to 200-character excerpt', async () => {
            mockCacheManager.set.mockResolvedValueOnce(undefined);

            await service.indexPost(event);

            const storedDoc = mockCacheManager.set.mock.calls[0][1];
            expect(storedDoc.excerpt.length).toBe(200);
        });

        it('should propagate cache errors', async () => {
            mockCacheManager.set.mockRejectedValueOnce(new Error('Redis down'));

            await expect(service.indexPost(event)).rejects.toThrow('Redis down');
        });
    });

    describe('getIndexedPost', () => {
        it('should return cached document when it exists', async () => {
            const doc = { id: 'post-abc', title: 'Test' };
            mockCacheManager.get.mockResolvedValueOnce(doc);

            const result = await service.getIndexedPost('post-abc');

            expect(mockCacheManager.get).toHaveBeenCalledWith('search:post:post-abc');
            expect(result).toEqual(doc);
        });

        it('should return null when post is not indexed', async () => {
            mockCacheManager.get.mockResolvedValueOnce(null);

            const result = await service.getIndexedPost('missing-id');

            expect(result).toBeNull();
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';

import { IndexingController } from 'src/modules/indexing/indexing.controller';
import { IndexingService } from 'src/modules/indexing/indexing.service';
import { PostCreatedEvent } from 'src/modules/indexing/events/post-created.event';

describe('IndexingController', () => {
    let controller: IndexingController;
    let indexingService: jest.Mocked<IndexingService>;

    const mockChannel = {
        ack: jest.fn(),
        nack: jest.fn(),
    };

    const mockRmqContext = {
        getChannelRef: jest.fn().mockReturnValue(mockChannel),
        getMessage: jest.fn().mockReturnValue({}),
    } as unknown as RmqContext;

    const mockEvent: PostCreatedEvent = {
        postId: 'post-123',
        title: 'Hello World',
        content: 'This is a test post content.',
        authorId: 'user-456',
        createdAt: new Date().toISOString(),
    };

    beforeEach(async () => {
        indexingService = {
            indexPost: jest.fn(),
            getIndexedPost: jest.fn(),
        } as unknown as jest.Mocked<IndexingService>;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [IndexingController],
            providers: [{ provide: IndexingService, useValue: indexingService }],
        }).compile();

        controller = module.get<IndexingController>(IndexingController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handlePostCreated', () => {
        it('should index the post and ACK message on success', async () => {
            indexingService.indexPost.mockResolvedValueOnce(undefined);

            await controller.handlePostCreated(mockEvent, mockRmqContext);

            expect(indexingService.indexPost).toHaveBeenCalledWith(mockEvent);
            expect(mockChannel.ack).toHaveBeenCalledWith({});
            expect(mockChannel.nack).not.toHaveBeenCalled();
        });

        it('should NACK message when indexing service throws', async () => {
            indexingService.indexPost.mockRejectedValueOnce(new Error('Cache unavailable'));

            await controller.handlePostCreated(mockEvent, mockRmqContext);

            expect(indexingService.indexPost).toHaveBeenCalledWith(mockEvent);
            expect(mockChannel.nack).toHaveBeenCalledWith({}, false, true);
            expect(mockChannel.ack).not.toHaveBeenCalled();
        });
    });
});

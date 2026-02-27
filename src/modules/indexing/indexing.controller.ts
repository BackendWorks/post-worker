import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";

import { IndexingService } from "./indexing.service";
import { PostCreatedEvent } from "./events/post-created.event";

@Controller()
export class IndexingController {
  private readonly logger = new Logger(IndexingController.name);

  constructor(private readonly indexingService: IndexingService) {}

  /**
   * Handles the 'post.created' event emitted by post-service after a post is created.
   *
   * Flow:
   *   post-service (create) → RabbitMQ (post.created) → post-worker (this handler)
   *
   * Manual ACK ensures at-least-once delivery:
   * - Success → ACK (message is removed from queue)
   * - Failure → NACK with requeue:true (message is retried)
   */
  @EventPattern("post.created")
  async handlePostCreated(
    @Payload() data: PostCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(
        `[post.created] Received event for postId: ${data.postId}`,
      );

      await this.indexingService.indexPost(data);

      // ACK — processing successful
      channel.ack(originalMessage);

      this.logger.log(
        `[post.created] Successfully indexed postId: ${data.postId}`,
      );
    } catch (error) {
      this.logger.error(
        `[post.created] Failed to index postId: ${data?.postId}`,
        error,
      );

      // NACK — re-queue for retry
      channel.nack(originalMessage, false, true);
    }
  }
}

/**
 * Event payload emitted by post-service after a post is successfully created.
 * Published to the RabbitMQ exchange with routing key 'post.created'.
 */
export class PostCreatedEvent {
  /** The newly-created post's ID */
  postId: string;

  /** The post title */
  title: string;

  /** The post body content */
  content: string;

  /** The ID of the user who authored the post */
  authorId: string;

  /** ISO timestamp of when the post was created */
  createdAt: string;
}

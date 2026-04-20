import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma";

export async function createNotification(params: {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
  eventId?: string;
  clubId?: string;
}) {
  // Don't notify yourself
  if (params.userId === params.actorId) return;

  await prisma.notification.create({ data: params });
}

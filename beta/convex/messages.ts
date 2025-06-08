import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper function to get participant ID from either legacy or new format
function getParticipantId(participant: any): Id<"users"> {
  return typeof participant === "string" ? participant : participant._id;
}

// Helper function to check if user is participant
function isUserParticipant(participants: any[], userId: Id<"users">): boolean {
  return participants.some(p => getParticipantId(p) === userId);
}

// Helper function to detect image URLs
function detectImageEmbeds(content: string) {
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  const matches = content.match(imageUrlRegex);
  
  if (!matches) return [];
  
  return matches.map(url => ({
    type: "image" as const,
    url: url,
  }));
}

export const getMessages = query({
  args: { 
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify user is participant in conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !isUserParticipant(conversation.participants, userId)) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(args.limit || 50);

    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const senderProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", message.senderId))
          .unique();

        let replyToMessage: any = null;
        if (message.replyTo) {
          const replyMsg = await ctx.db.get(message.replyTo);
          if (replyMsg) {
            const replyToSender = await ctx.db.get(replyMsg.senderId);
            const replyToSenderProfile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", replyMsg.senderId))
              .unique();
            replyToMessage = {
              ...replyMsg,
              sender: replyToSender && replyToSenderProfile ? { ...replyToSender, profile: replyToSenderProfile } : null,
            };
          }
        }

        return {
          ...message,
          sender: sender && senderProfile ? { ...sender, profile: senderProfile } : null,
          replyTo: replyToMessage,
        };
      })
    );

    return messagesWithSenders.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("file"))),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is banned
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile?.banned) {
      throw new Error("You are banned from sending messages");
    }

    // Verify user is participant in conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !isUserParticipant(conversation.participants, userId)) {
      throw new Error("Not authorized to send message to this conversation");
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions: any[] = [];
    let match;
    while ((match = mentionRegex.exec(args.content)) !== null) {
      const username = match[1];
      const mentionedProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();
      if (mentionedProfile) {
        mentions.push(mentionedProfile.userId);
      }
    }

    // Detect image embeds
    const embeds = detectImageEmbeds(args.content);

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      replyTo: args.replyTo,
      mentions: mentions.length > 0 ? mentions : undefined,
      embeds: embeds.length > 0 ? embeds : undefined,
    });

    return messageId;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== userId) {
      throw new Error("Not authorized to edit this message");
    }

    // Detect new embeds
    const embeds = detectImageEmbeds(args.content);

    await ctx.db.patch(args.messageId, {
      content: args.content,
      edited: true,
      editedAt: Date.now(),
      embeds: embeds.length > 0 ? embeds : undefined,
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== userId) {
      throw new Error("Not authorized to delete this message");
    }

    await ctx.db.delete(args.messageId);
  },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversations = await ctx.db
      .query("conversations")
      .collect();

    // Filter conversations where user is a participant
    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId)
    );

    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conversation) => {
        const otherParticipants = conversation.participants.filter(id => id !== userId);
        const participants = await Promise.all(
          otherParticipants.map(async (participantId) => {
            const user = await ctx.db.get(participantId);
            const profile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", participantId))
              .unique();
            return user && profile ? { ...user, profile } : null;
          })
        );

        return {
          ...conversation,
          participants: participants.filter(Boolean),
        };
      })
    );

    return conversationsWithDetails;
  },
});

export const getOrCreateDirectConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.otherUserId) {
      throw new Error("Cannot create conversation with yourself");
    }

    // Check if conversation already exists
    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), "direct"),
          q.or(
            q.and(
              q.eq(q.field("participants"), [userId, args.otherUserId])
            ),
            q.and(
              q.eq(q.field("participants"), [args.otherUserId, userId])
            )
          )
        )
      )
      .first();

    if (existingConversation) {
      return existingConversation._id;
    }

    // Create new conversation
    return await ctx.db.insert("conversations", {
      participants: [userId, args.otherUserId],
      type: "direct",
      lastMessageTime: Date.now(),
    });
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return null;
    }

    const participants = await Promise.all(
      conversation.participants.map(async (participantId) => {
        const user = await ctx.db.get(participantId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", participantId))
          .unique();
        return user && profile ? { ...user, profile } : null;
      })
    );

    return {
      ...conversation,
      participants: participants.filter(Boolean),
    };
  },
});

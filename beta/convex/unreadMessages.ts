import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUnreadCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("unreadMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const markConversationAsRead = mutation({
  args: { 
    conversationId: v.id("conversations"),
    lastMessageId: v.optional(v.id("messages"))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("unreadMessages")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", userId).eq("conversationId", args.conversationId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        count: 0,
        lastReadMessageId: args.lastMessageId,
      });
    } else {
      await ctx.db.insert("unreadMessages", {
        userId,
        conversationId: args.conversationId,
        count: 0,
        lastReadMessageId: args.lastMessageId,
      });
    }
  },
});

export const incrementUnreadCount = internalMutation({
  args: { 
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("unreadMessages")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("unreadMessages", {
        userId: args.userId,
        conversationId: args.conversationId,
        count: 1,
      });
    }
  },
});

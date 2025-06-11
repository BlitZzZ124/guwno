import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const getChannelMessages = query({
  args: { 
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);

    const messagesWithAuthors = await Promise.all(
      messages.page.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", message.authorId))
          .first();

        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        const reactionCounts = reactions.reduce((acc, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const userReactions = reactions
          .filter(r => r.userId === userId)
          .map(r => r.emoji);

        return {
          ...message,
          author: {
            ...author,
            displayName: profile?.displayName || author?.name,
            avatar: profile?.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          },
          reactions: reactionCounts,
          userReactions,
        };
      })
    );

    return {
      ...messages,
      page: messagesWithAuthors.reverse(),
    };
  },
});

export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      authorId: userId,
      channelId: args.channelId,
      attachments: args.attachments,
    });

    // Check for mentions and create notifications
    const mentionRegex = /@(\w+)/g;
    const mentions = args.content.match(mentionRegex);
    
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1);
        const mentionedUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("name"), username))
          .first();

        if (mentionedUser && mentionedUser._id !== userId) {
          await ctx.db.insert("notifications", {
            userId: mentionedUser._id,
            type: "mention",
            title: "You were mentioned",
            content: args.content.substring(0, 100),
            read: false,
            data: { 
              channelId: args.channelId, 
              messageId,
              fromUserId: userId 
            },
          });
        }
      }
    }

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
    if (!message || message.authorId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      edited: true,
      editedAt: Date.now(),
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message || message.authorId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.messageId);

    // Delete associated reactions
    const reactions = await ctx.db
      .query("messageReactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    await Promise.all(reactions.map(reaction => ctx.db.delete(reaction._id)));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

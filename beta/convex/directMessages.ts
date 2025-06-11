import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const getOrCreateDM = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    if (currentUserId === args.userId) {
      throw new Error("Cannot create DM with yourself");
    }

    const participants = [currentUserId, args.userId].sort();

    // Find existing DM by checking all DMs for matching participants
    const allDMs = await ctx.db.query("directMessages").collect();
    let dm = allDMs.find(existingDM => 
      existingDM.participants.length === 2 &&
      existingDM.participants.includes(participants[0]) &&
      existingDM.participants.includes(participants[1])
    );

    if (!dm) {
      const dmId = await ctx.db.insert("directMessages", {
        participants,
      });
      const newDM = await ctx.db.get(dmId);
      if (!newDM) throw new Error("Failed to create DM");
      dm = newDM;
    }

    return dm;
  },
});

export const getUserDMs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all DMs and filter for ones that include the current user
    const allDMs = await ctx.db.query("directMessages").collect();
    const dms = allDMs.filter(dm => dm.participants.includes(userId));

    const dmsWithUsers = await Promise.all(
      dms.map(async (dm) => {
        const otherUserId = dm.participants.find(id => id !== userId);
        if (!otherUserId) return null;

        const otherUser = await ctx.db.get(otherUserId);
        if (!otherUser) return null;

        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", otherUserId))
          .first();

        const lastMessage = dm.lastMessageId 
          ? await ctx.db.get(dm.lastMessageId)
          : null;

        return {
          ...dm,
          otherUser: {
            ...otherUser,
            profile: profile ? {
              ...profile,
              avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
            } : null,
          },
          lastMessage,
        };
      })
    );

    return dmsWithUsers
      .filter((dm): dm is NonNullable<typeof dm> => dm !== null)
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  },
});

export const getDMMessages = query({
  args: { 
    dmId: v.id("directMessages"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    const dm = await ctx.db.get(args.dmId);
    if (!dm || !dm.participants.includes(userId)) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const messages = await ctx.db
      .query("dmMessages")
      .withIndex("by_dm", (q) => q.eq("dmId", args.dmId))
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
          .query("dmReactions")
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

export const sendDMMessage = mutation({
  args: {
    dmId: v.id("directMessages"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dm = await ctx.db.get(args.dmId);
    if (!dm || !dm.participants.includes(userId)) {
      throw new Error("Access denied");
    }

    const messageId = await ctx.db.insert("dmMessages", {
      content: args.content,
      authorId: userId,
      dmId: args.dmId,
      attachments: args.attachments,
    });

    await ctx.db.patch(args.dmId, {
      lastMessageAt: Date.now(),
      lastMessageId: messageId,
    });

    // Create notification for other user
    const otherUserId = dm.participants.find(id => id !== userId);
    if (otherUserId) {
      await ctx.db.insert("notifications", {
        userId: otherUserId,
        type: "message",
        title: "New direct message",
        content: args.content.substring(0, 100),
        read: false,
        data: { dmId: args.dmId, fromUserId: userId },
      });
    }

    return messageId;
  },
});

export const addDMReaction = mutation({
  args: {
    messageId: v.id("dmMessages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("dmReactions")
      .withIndex("by_user_message", (q) => q.eq("userId", userId).eq("messageId", args.messageId))
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("dmReactions", {
        messageId: args.messageId,
        userId,
        emoji: args.emoji,
      });
    }
  },
});

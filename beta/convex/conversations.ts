import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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
        if (conversation.type === "general") {
          return {
            ...conversation,
            participants: [],
            name: "General Chat",
          };
        }

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

    // Sort conversations: general first, then by last message time
    return conversationsWithDetails.sort((a, b) => {
      if (a.type === "general" && b.type !== "general") return -1;
      if (a.type !== "general" && b.type === "general") return 1;
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
    });
  },
});

export const ensureUserInGeneralChat = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    // Check if general chat exists
    let generalChat = await ctx.db
      .query("conversations")
      .withIndex("by_type", (q) => q.eq("type", "general"))
      .first();

    if (!generalChat) {
      // Create general chat
      const chatId = await ctx.db.insert("conversations", {
        participants: [userId],
        type: "general",
        name: "General Chat",
        lastMessageTime: Date.now(),
      });
      return chatId;
    } else {
      // Add user to general chat if not already a participant
      if (!generalChat.participants.includes(userId)) {
        await ctx.db.patch(generalChat._id, {
          participants: [...generalChat.participants, userId],
        });
      }
      return generalChat._id;
    }
  },
});



export const createOrJoinGeneralChat = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    // Check if general chat exists
    let generalChat = await ctx.db
      .query("conversations")
      .withIndex("by_type", (q) => q.eq("type", "general"))
      .first();

    if (!generalChat) {
      // Create general chat
      const chatId = await ctx.db.insert("conversations", {
        participants: [userId],
        type: "general",
        name: "General Chat",
        lastMessageTime: Date.now(),
      });
      return chatId;
    } else {
      // Add user to general chat if not already a participant
      if (!generalChat.participants.includes(userId)) {
        await ctx.db.patch(generalChat._id, {
          participants: [...generalChat.participants, userId],
        });
      }
      return generalChat._id;
    }
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

    if (conversation.type === "general") {
      return {
        ...conversation,
        participants: [],
        name: "General Chat",
      };
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

export const getGeneralChatMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== "general") {
      return [];
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return [];
    }

    const members = await Promise.all(
      conversation.participants.map(async (participantId) => {
        const user = await ctx.db.get(participantId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", participantId))
          .unique();
        return user && profile ? { ...user, profile } : null;
      })
    );

    return members.filter(Boolean).sort((a, b) => {
      // Sort by status: online first, then away, then offline
      const statusOrder = { online: 0, away: 1, offline: 2 };
      const aStatus = a!.profile?.status || "offline";
      const bStatus = b!.profile?.status || "offline";
      
      if (statusOrder[aStatus as keyof typeof statusOrder] !== statusOrder[bStatus as keyof typeof statusOrder]) {
        return statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder];
      }
      
      // Then sort by display name
      return (a!.profile?.displayName || "").localeCompare(b!.profile?.displayName || "");
    });
  },
});

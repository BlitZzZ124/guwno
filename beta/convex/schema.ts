import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    aboutMe: v.optional(v.string()),
    status: v.union(v.literal("online"), v.literal("away"), v.literal("dnd"), v.literal("offline")),
    lastSeen: v.number(),
    verified: v.boolean(),
    doNotDisturb: v.boolean(),
    banned: v.optional(v.boolean()),
    badges: v.optional(v.array(v.object({
      name: v.string(),
      imageUrl: v.string(),
      description: v.optional(v.string()),
    }))),
  })
    .index("by_user_id", ["userId"])
    .index("by_username", ["username"]),

  conversations: defineTable({
    type: v.union(v.literal("dm"), v.literal("group"), v.literal("general"), v.literal("direct")),
    name: v.optional(v.string()),
    participants: v.union(
      v.array(v.id("users")), // Legacy format
      v.array(v.object({
        _id: v.id("users"),
        profile: v.optional(v.object({
          username: v.string(),
          displayName: v.string(),
          avatarUrl: v.optional(v.string()),
          status: v.union(v.literal("online"), v.literal("away"), v.literal("dnd"), v.literal("offline")),
          verified: v.boolean(),
          badges: v.optional(v.array(v.object({
            name: v.string(),
            imageUrl: v.string(),
            description: v.optional(v.string()),
          }))),
        })),
      }))
    ),
    createdBy: v.optional(v.id("users")),
    lastMessage: v.optional(v.string()),
    lastMessageTime: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    replyTo: v.optional(v.id("messages")),
    mentions: v.optional(v.array(v.string())),
    embeds: v.optional(v.array(v.object({
      type: v.string(),
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
    }))),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user", ["toUserId"])
    .index("by_status", ["status"]),

  friends: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastTyping: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  customEmojis: defineTable({
    name: v.string(),
    imageUrl: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_name", ["name"])
    .index("by_created_by", ["createdBy"]),

  voiceCalls: defineTable({
    conversationId: v.id("conversations"),
    participants: v.array(v.object({
      userId: v.id("users"),
      joinedAt: v.number(),
      muted: v.boolean(),
      deafened: v.boolean(),
    })),
    active: v.boolean(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_active", ["active"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

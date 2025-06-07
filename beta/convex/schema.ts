import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
    lastSeen: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_username", ["username"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    type: v.union(v.literal("direct"), v.literal("group")),
    name: v.optional(v.string()),
    lastMessageTime: v.optional(v.number()),
    lastMessage: v.optional(v.string()),
  })
    .index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    replyTo: v.optional(v.id("messages")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
  })
    .index("by_to_user", ["toUserId"])
    .index("by_from_user", ["fromUserId"])
    .index("by_users", ["fromUserId", "toUserId"]),

  friends: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

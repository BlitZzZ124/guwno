import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  servers: defineTable({
    name: v.string(),
    icon: v.optional(v.id("_storage")),
    ownerId: v.id("users"),
    inviteCode: v.string(),
    description: v.optional(v.string()),
  }).index("by_owner", ["ownerId"])
    .index("by_invite_code", ["inviteCode"]),

  channels: defineTable({
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice")),
    serverId: v.id("servers"),
    position: v.number(),
    topic: v.optional(v.string()),
  }).index("by_server", ["serverId", "position"]),

  messages: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    attachments: v.optional(v.array(v.id("_storage"))),
    replyTo: v.optional(v.id("messages")),
  }).index("by_channel", ["channelId"]),

  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  }).index("by_message", ["messageId"])
    .index("by_user_message", ["userId", "messageId"]),

  serverMembers: defineTable({
    serverId: v.id("servers"),
    userId: v.id("users"),
    joinedAt: v.number(),
    nickname: v.optional(v.string()),
    roles: v.optional(v.array(v.id("serverRoles"))),
  }).index("by_server", ["serverId"])
    .index("by_user", ["userId"])
    .index("by_server_user", ["serverId", "userId"]),

  serverRoles: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    color: v.optional(v.string()),
    permissions: v.array(v.string()),
    position: v.number(),
    mentionable: v.boolean(),
  }).index("by_server", ["serverId", "position"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    avatar: v.optional(v.id("_storage")),
    banner: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("dnd"),
      v.literal("invisible")
    ),
    customStatus: v.optional(v.string()),
    lastSeen: v.number(),
  }).index("by_user", ["userId"]),

  friendships: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
  }).index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"])
    .index("by_users", ["requesterId", "addresseeId"]),

  directMessages: defineTable({
    participants: v.array(v.id("users")),
    lastMessageAt: v.optional(v.number()),
    lastMessageId: v.optional(v.id("dmMessages")),
  }).index("by_participants", ["participants"]),

  dmMessages: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    dmId: v.id("directMessages"),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    attachments: v.optional(v.array(v.id("_storage"))),
    replyTo: v.optional(v.id("dmMessages")),
  }).index("by_dm", ["dmId"]),

  dmReactions: defineTable({
    messageId: v.id("dmMessages"),
    userId: v.id("users"),
    emoji: v.string(),
  }).index("by_message", ["messageId"])
    .index("by_user_message", ["userId", "messageId"]),

  voiceStates: defineTable({
    userId: v.id("users"),
    channelId: v.optional(v.id("channels")),
    serverId: v.optional(v.id("servers")),
    muted: v.boolean(),
    deafened: v.boolean(),
    joinedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_channel", ["channelId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("friend_request"),
      v.literal("server_invite"),
      v.literal("mention")
    ),
    title: v.string(),
    content: v.string(),
    read: v.boolean(),
    data: v.optional(v.object({
      serverId: v.optional(v.id("servers")),
      channelId: v.optional(v.id("channels")),
      messageId: v.optional(v.id("messages")),
      dmId: v.optional(v.id("directMessages")),
      fromUserId: v.optional(v.id("users")),
    })),
  }).index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const friendships = await ctx.db
      .query("friends")
      .filter((q) => 
        q.or(
          q.eq(q.field("user1Id"), userId),
          q.eq(q.field("user2Id"), userId)
        )
      )
      .collect();

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id;
        const friend = await ctx.db.get(friendId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", friendId))
          .unique();
        return friend && profile ? { ...friend, profile } : null;
      })
    );

    return friends.filter(Boolean);
  },
});

export const getFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithSenders = await Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.fromUserId);
        const senderProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", request.fromUserId))
          .unique();
        return {
          ...request,
          sender: sender && senderProfile ? { ...sender, profile: senderProfile } : null,
        };
      })
    );

    return requestsWithSenders;
  },
});

export const sendFriendRequest = mutation({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.toUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if already friends
    const existingFriendship = await ctx.db
      .query("friends")
      .filter((q) => 
        q.or(
          q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), args.toUserId)),
          q.and(q.eq(q.field("user1Id"), args.toUserId), q.eq(q.field("user2Id"), userId))
        )
      )
      .first();

    if (existingFriendship) {
      throw new Error("Already friends");
    }

    // Check if request already exists
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.and(q.eq(q.field("toUserId"), args.toUserId), q.eq(q.field("status"), "pending")))
      .first();

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    return await ctx.db.insert("friendRequests", {
      fromUserId: userId,
      toUserId: args.toUserId,
      status: "pending",
    });
  },
});

export const respondToFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Friend request not found");

    if (request.toUserId !== userId) {
      throw new Error("Not authorized to respond to this request");
    }

    if (args.accept) {
      // Create friendship
      await ctx.db.insert("friends", {
        user1Id: request.fromUserId,
        user2Id: request.toUserId,
      });

      await ctx.db.patch(args.requestId, { status: "accepted" });
    } else {
      await ctx.db.patch(args.requestId, { status: "declined" });
    }
  },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.query.length < 2) return [];

    const users = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.eq(q.field("name"), args.query),
          q.eq(q.field("email"), args.query)
        )
      )
      .take(10);

    const usersWithProfiles = await Promise.all(
      users
        .filter(user => user._id !== userId)
        .map(async (user) => {
          const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

          const friendship = await ctx.db
            .query("friendships")
            .withIndex("by_users", (q) => q.eq("requesterId", userId).eq("addresseeId", user._id))
            .first() || await ctx.db
            .query("friendships")
            .withIndex("by_users", (q) => q.eq("requesterId", user._id).eq("addresseeId", userId))
            .first();

          return {
            ...user,
            profile: profile ? {
              ...profile,
              avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
            } : null,
            friendshipStatus: friendship?.status || null,
            isRequester: friendship?.requesterId === userId,
          };
        })
    );

    return usersWithProfiles;
  },
});

export const sendFriendRequest = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requesterId = await getAuthUserId(ctx);
    if (!requesterId) throw new Error("Not authenticated");

    if (requesterId === args.userId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) => q.eq("requesterId", requesterId).eq("addresseeId", args.userId))
      .first() || await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) => q.eq("requesterId", args.userId).eq("addresseeId", requesterId))
      .first();

    if (existing) {
      throw new Error("Friend request already exists");
    }

    await ctx.db.insert("friendships", {
      requesterId,
      addresseeId: args.userId,
      status: "pending",
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "friend_request",
      title: "New friend request",
      content: "Someone sent you a friend request",
      read: false,
      data: { fromUserId: requesterId },
    });
  },
});

export const respondToFriendRequest = mutation({
  args: { 
    friendshipId: v.id("friendships"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship || friendship.addresseeId !== userId) {
      throw new Error("Friend request not found");
    }

    if (args.accept) {
      await ctx.db.patch(args.friendshipId, { status: "accepted" });
    } else {
      await ctx.db.delete(args.friendshipId);
    }
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const friendships = await ctx.db
      .query("friendships")
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("requesterId"), userId),
            q.eq(q.field("addresseeId"), userId)
          ),
          q.eq(q.field("status"), "accepted")
        )
      )
      .collect();

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.requesterId === userId 
          ? friendship.addresseeId 
          : friendship.requesterId;
        
        const friend = await ctx.db.get(friendId);
        if (!friend) return null;

        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", friendId))
          .first();

        return {
          ...friend,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
        };
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
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterId);
        if (!requester) return null;

        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", request.requesterId))
          .first();

        return {
          ...request,
          requester: {
            ...requester,
            profile: profile ? {
              ...profile,
              avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
            } : null,
          },
        };
      })
    );

    return requestsWithUsers.filter(Boolean);
  },
});

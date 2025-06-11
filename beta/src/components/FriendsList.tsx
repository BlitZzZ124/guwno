import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function FriendsList() {
  const [activeTab, setActiveTab] = useState<"online" | "all" | "pending" | "add">("online");
  const [searchQuery, setSearchQuery] = useState("");
  
  const friends = useQuery(api.friends.getFriends) || [];
  const friendRequests = useQuery(api.friends.getFriendRequests) || [];
  const searchResults = useQuery(
    api.friends.searchUsers,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  ) || [];
  
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const respondToFriendRequest = useMutation(api.friends.respondToFriendRequest);
  const getOrCreateDM = useMutation(api.directMessages.getOrCreateDM);

  const onlineFriends = friends.filter(friend => 
    friend && (friend.profile?.status === "online" || friend.profile?.status === "idle")
  );

  const handleSendFriendRequest = async (userId: Id<"users">) => {
    try {
      await sendFriendRequest({ userId });
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleRespondToRequest = async (friendshipId: Id<"friendships">, accept: boolean) => {
    try {
      await respondToFriendRequest({ friendshipId, accept });
    } catch (error) {
      console.error("Failed to respond to friend request:", error);
    }
  };

  const handleStartDM = async (userId: Id<"users">) => {
    try {
      await getOrCreateDM({ userId });
    } catch (error) {
      console.error("Failed to create DM:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-discord-border">
        {[
          { key: "online", label: "Online", count: onlineFriends.length },
          { key: "all", label: "All", count: friends.length },
          { key: "pending", label: "Pending", count: friendRequests.length },
          { key: "add", label: "Add Friend" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-white border-b-2 border-discord-blurple"
                : "text-discord-muted hover:text-white"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 bg-discord-blurple text-white text-xs px-1 rounded">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "add" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Friend</h3>
              <p className="text-discord-muted text-sm mb-4">
                You can add friends by searching for their username.
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 px-3 py-2 bg-discord-input text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none"
                />
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-discord-muted uppercase">Search Results</h4>
                {searchResults.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-discord-light rounded">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center mr-3">
                        {user.profile?.avatarUrl ? (
                          <img
                            src={user.profile.avatarUrl}
                            alt={user.profile?.displayName || user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {(user.profile?.displayName || user.name || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {user.profile?.displayName || user.name}
                        </div>
                        <div className="text-discord-muted text-sm">
                          {user.name}
                        </div>
                      </div>
                    </div>
                    {!user.friendshipStatus && (
                      <button
                        onClick={() => handleSendFriendRequest(user._id)}
                        className="px-3 py-1 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded text-sm transition-colors"
                      >
                        Add Friend
                      </button>
                    )}
                    {user.friendshipStatus === "pending" && (
                      <span className="text-discord-muted text-sm">
                        {user.isRequester ? "Request sent" : "Pending"}
                      </span>
                    )}
                    {user.friendshipStatus === "accepted" && (
                      <span className="text-discord-green text-sm">Friends</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "pending" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pending Friend Requests</h3>
            {friendRequests.length === 0 ? (
              <p className="text-discord-muted">No pending friend requests</p>
            ) : (
              <div className="space-y-2">
                {friendRequests.filter(request => request !== null).map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-discord-light rounded">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center mr-3">
                        {request.requester.profile?.avatarUrl ? (
                          <img
                            src={request.requester.profile.avatarUrl}
                            alt={request.requester.profile?.displayName || request.requester.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {(request.requester.profile?.displayName || request.requester.name || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {request.requester.profile?.displayName || request.requester.name}
                        </div>
                        <div className="text-discord-muted text-sm">
                          Incoming friend request
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRespondToRequest(request._id, true)}
                        className="px-3 py-1 bg-discord-green hover:bg-green-600 text-white rounded text-sm transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request._id, false)}
                        className="px-3 py-1 bg-discord-red hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === "online" || activeTab === "all") && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {activeTab === "online" ? "Online Friends" : "All Friends"}
            </h3>
            {(activeTab === "online" ? onlineFriends : friends).length === 0 ? (
              <p className="text-discord-muted">
                {activeTab === "online" ? "No friends online" : "No friends yet"}
              </p>
            ) : (
              <div className="space-y-2">
                {(activeTab === "online" ? onlineFriends : friends).filter(friend => friend !== null).map((friend) => (
                  <div key={friend._id} className="flex items-center justify-between p-3 bg-discord-light rounded hover:bg-discord-hover transition-colors">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center mr-3">
                          {friend.profile?.avatarUrl ? (
                            <img
                              src={friend.profile.avatarUrl}
                              alt={friend.profile?.displayName || friend.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {(friend.profile?.displayName || friend.name || "U").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {friend.profile?.status === "online" && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-discord-green rounded-full border-2 border-discord-light"></div>
                        )}
                        {friend.profile?.status === "idle" && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-discord-yellow rounded-full border-2 border-discord-light"></div>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {friend.profile?.displayName || friend.name}
                        </div>
                        <div className="text-discord-muted text-sm">
                          {friend.profile?.customStatus || friend.profile?.status || "Offline"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartDM(friend._id)}
                      className="px-3 py-1 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded text-sm transition-colors"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

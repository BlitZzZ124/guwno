import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface UserListProps {
  onClose: () => void;
  onStartConversation: (conversationId: string) => void;
}

export function UserList({ onClose, onStartConversation }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "friends" | "requests">("search");

  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  const friends = useQuery(api.friends.getFriends);
  const friendRequests = useQuery(api.friends.getFriendRequests);

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const respondToFriendRequest = useMutation(api.friends.respondToFriendRequest);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateDirectConversation);

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest({ toUserId: userId as any });
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send friend request");
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    try {
      await respondToFriendRequest({ requestId: requestId as any, accept });
      toast.success(accept ? "Friend request accepted!" : "Friend request declined");
    } catch (error) {
      toast.error("Failed to respond to friend request");
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const conversationId = await getOrCreateConversation({ otherUserId: userId as any });
      onStartConversation(conversationId);
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Find People</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "search"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "friends"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Friends ({friends?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "requests"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Requests ({friendRequests?.length || 0})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "search" && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search by username or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />

              {searchQuery.length < 2 ? (
                <p className="text-gray-400 text-center py-8">
                  Type at least 2 characters to search
                </p>
              ) : searchResults === undefined ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No users found</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.filter(Boolean).map((user) => (
                    <div key={user!._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                          {user!.profile?.avatarUrl ? (
                            <img
                              src={user!.profile.avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-lg">👤</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {user!.profile?.displayName}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{user!.profile?.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSendFriendRequest(user!._id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Add Friend
                        </button>
                        <button
                          onClick={() => handleStartConversation(user!._id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <div className="space-y-2">
              {friends?.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No friends yet</p>
              ) : (
                friends?.filter(Boolean).map((friend) => (
                  <div key={friend!._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                        {friend!.profile?.avatarUrl ? (
                          <img
                            src={friend!.profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {friend!.profile?.displayName}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{friend!.profile?.username}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartConversation(friend!._id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Message
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-2">
              {friendRequests?.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No pending requests</p>
              ) : (
                friendRequests?.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                        {request.sender?.profile?.avatarUrl ? (
                          <img
                            src={request.sender.profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {request.sender?.profile?.displayName}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{request.sender?.profile?.username}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRespondToRequest(request._id, true)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request._id, false)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

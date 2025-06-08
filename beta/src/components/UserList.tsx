import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface UserListProps {
  onClose: () => void;
}

export function UserList({ onClose }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const createDirectMessage = useMutation(api.conversations.createDirectMessage);
  const createGroupChat = useMutation(api.conversations.createGroupChat);

  const handleStartDirectMessage = async (userId: Id<"users">) => {
    try {
      const conversationId = await createDirectMessage({ otherUserId: userId });
      toast.success("Direct message started");
      onClose();
      // Navigate to the conversation
      window.location.hash = `#conversation-${conversationId}`;
    } catch (error) {
      toast.error("Failed to start direct message");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error("Please enter a group name and select at least one user");
      return;
    }

    try {
      const conversationId = await createGroupChat({
        name: groupName,
        userIds: selectedUsers as Id<"users">[],
      });
      toast.success("Group chat created");
      onClose();
      // Navigate to the conversation
      window.location.hash = `#conversation-${conversationId}`;
    } catch (error) {
      toast.error("Failed to create group chat");
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "status-online";
      case "away": return "status-away";
      case "dnd": return "status-dnd";
      default: return "status-offline";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {isCreatingGroup ? "Create Group Chat" : "Start Conversation"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setIsCreatingGroup(false)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              !isCreatingGroup
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setIsCreatingGroup(true)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isCreatingGroup
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Group Chat
          </button>
        </div>

        {isCreatingGroup && (
          <div className="mb-4">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-2"
            />
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {searchResults && searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.filter(user => user !== null && user._id !== currentUser?._id).map((user) => {
                if (!user) return null;
                const isSelected = selectedUsers.includes(user._id);
                
                return (
                  <div
                    key={user._id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isCreatingGroup
                        ? isSelected
                          ? "bg-blue-600 border-blue-500"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    }`}
                    onClick={() => {
                      if (isCreatingGroup) {
                        toggleUser(user._id);
                      } else {
                        handleStartDirectMessage(user._id as Id<"users">);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                          {user.profile?.avatarUrl ? (
                            <img
                              src={user.profile.avatarUrl}
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
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(user.profile?.status || "offline")}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-white">
                            {user.profile?.displayName}
                          </span>
                          {user.profile?.verified && (
                            <span className="verification-check">✓</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{user.profile?.username} • {user.profile?.status === "dnd" ? "Do Not Disturb" : user.profile?.status || "offline"}
                        </div>
                      </div>
                      {isCreatingGroup && isSelected && (
                        <span className="text-white">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center text-gray-400 py-8">
              No users found
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Type at least 2 characters to search
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          {isCreatingGroup && (
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

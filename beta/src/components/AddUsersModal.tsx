import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface AddUsersModalProps {
  conversationId: Id<"conversations">;
  onClose: () => void;
}

export function AddUsersModal({ conversationId, onClose }: AddUsersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const addUsersToConversation = useMutation(api.conversations.addUsersToConversation);

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      await addUsersToConversation({
        conversationId,
        userIds: selectedUsers as Id<"users">[],
      });
      toast.success(`Added ${selectedUsers.length} user(s) to the conversation`);
      onClose();
    } catch (error) {
      toast.error("Failed to add users");
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isUserAlreadyInConversation = (userId: string) => {
    return conversation?.participants.some(p => 
      typeof p === "string" ? p === userId : p._id === userId
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Add Users</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

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
              {searchResults.filter(user => user !== null).map((user) => {
                if (!user) return null;
                const isAlreadyInConversation = isUserAlreadyInConversation(user._id);
                const isSelected = selectedUsers.includes(user._id);
                
                return (
                  <div
                    key={user._id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isAlreadyInConversation
                        ? "bg-gray-700 border-gray-600 opacity-50"
                        : isSelected
                        ? "bg-blue-600 border-blue-500"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-pointer"
                    }`}
                    onClick={() => !isAlreadyInConversation && toggleUser(user._id)}
                  >
                    <div className="flex items-center space-x-3">
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
                          @{user.profile?.username}
                        </div>
                      </div>
                      {isAlreadyInConversation && (
                        <span className="text-xs text-gray-400">Already in conversation</span>
                      )}
                      {isSelected && !isAlreadyInConversation && (
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
          <button
            onClick={handleAddUsers}
            disabled={selectedUsers.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add ({selectedUsers.length})
          </button>
        </div>
      </div>
    </div>
  );
}

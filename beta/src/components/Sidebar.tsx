import { useState } from "react";
import { SignOutButton } from "../SignOutButton";
import { ProfileModal } from "./ProfileModal";
import { Id } from "../../convex/_generated/dataModel";

interface SidebarProps {
  conversations: any[];
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  onShowUserList: () => void;
  currentUser: any;
}

export function Sidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onShowUserList,
  currentUser,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    if (conv.type === "general") return true;
    return conv.participants.some((p: any) =>
      p.profile?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getConversationName = (conversation: any) => {
    if (conversation.type === "general") {
      return "General Chat";
    }
    if (conversation.type === "group" && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participants[0];
    return otherParticipant?.profile?.displayName || otherParticipant?.profile?.username || "Unknown User";
  };

  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === "general") {
      return null; // Will show 🌍 emoji
    }
    if (conversation.type === "group") {
      return null; // Could implement group avatars later
    }
    
    const otherParticipant = conversation.participants[0];
    return otherParticipant?.profile?.avatarUrl;
  };

  const getConversationIcon = (conversation: any) => {
    if (conversation.type === "general") {
      return "🌍";
    }
    return "👤";
  };

  return (
    <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold text-white mb-4">nevelose.xyz</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* New Conversation Button */}
        <button
          onClick={onShowUserList}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + New Conversation
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
                  selectedConversationId === conversation._id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-lg">{getConversationIcon(conversation)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {getConversationName(conversation)}
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-sm text-gray-400 truncate">
                        {conversation.lastMessage}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 hover:bg-gray-700 rounded-lg p-2 transition-colors flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
              {currentUser?.profile?.avatarUrl ? (
                <img
                  src={currentUser.profile.avatarUrl}
                  alt="Your avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {currentUser?.profile?.displayName}
              </div>
              <div className="text-xs text-gray-400 truncate">
                @{currentUser?.profile?.username}
              </div>
            </div>
          </button>
          <SignOutButton />
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && currentUser && (
        <ProfileModal
          userId={currentUser._id}
          onClose={() => setShowProfile(false)}
          isOwnProfile={true}
        />
      )}
    </div>
  );
}

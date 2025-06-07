import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProfileModal } from "./ProfileModal";
import { AdminDashboard } from "./AdminDashboard";
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
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conversation: any } | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const isAdmin = useQuery(api.users.isAdmin);
  const updateProfile = useMutation(api.users.updateProfile);

  // Update document title with unread count
  useEffect(() => {
    const unreadCount = conversations.filter(conv => 
      conv.type !== "general" && conv.lastMessageTime && 
      conv.lastMessageTime > (currentUser?.profile?.lastSeen || 0)
    ).length;
    
    document.title = unreadCount > 0 ? `(${unreadCount}) nevelose.xyz` : "nevelose.xyz";
  }, [conversations, currentUser]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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

  const toggleDoNotDisturb = async () => {
    try {
      await updateProfile({
        doNotDisturb: !currentUser?.profile?.doNotDisturb,
        status: currentUser?.profile?.doNotDisturb ? "online" : "dnd",
      });
    } catch (error) {
      console.error("Failed to toggle do not disturb:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "status-online";
      case "away": return "status-away";
      case "dnd": return "status-dnd";
      default: return "status-offline";
    }
  };

  const handleContextMenu = (e: React.MouseEvent, conversation: any) => {
    e.preventDefault();
    if (conversation.type !== "general" && conversation.participants.length > 0) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        conversation
      });
    }
  };

  const openUserProfile = (userId: string) => {
    setProfileUserId(userId);
    setContextMenu(null);
  };

  return (
    <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700 h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
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
                onContextMenu={(e) => handleContextMenu(e, conversation)}
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
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 hover:bg-gray-700 rounded-lg p-2 transition-colors flex-1"
          >
            <div className="relative">
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
              {/* Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(currentUser?.profile?.status || "offline")}`}></div>
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
          
          <div className="flex items-center space-x-1">
            {/* Do Not Disturb Toggle */}
            <button
              onClick={toggleDoNotDisturb}
              className={`p-2 rounded transition-colors ${
                currentUser?.profile?.doNotDisturb
                  ? "text-red-400 hover:text-red-300"
                  : "text-gray-400 hover:text-white"
              }`}
              title={currentUser?.profile?.doNotDisturb ? "Disable Do Not Disturb" : "Enable Do Not Disturb"}
            >
              🔕
            </button>
            
            {/* Admin Settings */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Admin Dashboard"
              >
                ⚙️
              </button>
            )}
            
            {/* Sign Out Button - Icon */}
            <button
              onClick={() => {
                // This will be handled by the SignOutButton component
                const signOutEvent = new CustomEvent('signOut');
                window.dispatchEvent(signOutEvent);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-700 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => openUserProfile(contextMenu.conversation.participants[0]._id)}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
          >
            View Profile
          </button>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && currentUser && (
        <ProfileModal
          userId={currentUser._id}
          onClose={() => setShowProfile(false)}
          isOwnProfile={true}
        />
      )}

      {/* User Profile Modal */}
      {profileUserId && (
        <ProfileModal
          userId={profileUserId as Id<"users">}
          onClose={() => setProfileUserId(null)}
          isOwnProfile={profileUserId === currentUser?._id}
        />
      )}

      {/* Admin Dashboard */}
      {showAdminDashboard && isAdmin && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}
    </div>
  );
}

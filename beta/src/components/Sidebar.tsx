import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ProfileModal } from "./ProfileModal";
import { toast } from "sonner";

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
  const [showProfile, setShowProfile] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const updateProfile = useMutation(api.users.updateProfile);
  const unreadCounts = useQuery(api.unreadMessages.getUnreadCounts) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "status-online";
      case "away": return "status-away";
      case "dnd": return "status-dnd";
      default: return "status-offline";
    }
  };

  const getConversationIcon = (conversation: any) => {
    if (conversation.type === "general") {
      return "🌍";
    }
    if (conversation.type === "group") {
      return "👥";
    }
    
    // For DMs, show the other user's avatar or status
    const otherParticipant = conversation.participants.find(
      (p: any) => (typeof p === "string" ? p : p._id) !== currentUser?._id
    );
    
    if (typeof otherParticipant !== "string" && otherParticipant?.profile?.avatarUrl) {
      return (
        <div className="relative">
          <img
            src={otherParticipant.profile.avatarUrl}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(otherParticipant.profile?.status || "offline")}`}></div>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <span className="text-2xl">👤</span>
        {otherParticipant && (
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(otherParticipant.profile?.status || "offline")}`}></div>
        )}
      </div>
    );
  };

  const getConversationName = (conversation: any) => {
    if (conversation.type === "general") {
      return "General Chat";
    }
    if (conversation.type === "group" && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participants.find(
      (p: any) => p._id !== currentUser?._id
    );
    return otherParticipant?.profile?.displayName || "Unknown User";
  };

  const getUnreadCount = (conversationId: string) => {
    const unread = unreadCounts.find(u => u.conversationId === conversationId);
    return unread?.count || 0;
  };

  const handleStatusChange = async (newStatus: "online" | "away" | "dnd" | "offline") => {
    try {
      await updateProfile({ 
        status: newStatus,
        doNotDisturb: newStatus === "dnd"
      });
      setShowStatusMenu(false);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "away": return "Away";
      case "dnd": return "Do Not Disturb";
      default: return "Offline";
    }
  };

  return (
    <div className="w-64 bg-gray-900 flex flex-col h-full">
      {/* Server Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">nevelose.xyz</h1>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Conversations
            </h3>
            <button
              onClick={onShowUserList}
              className="text-gray-400 hover:text-white transition-colors"
              title="Start new conversation"
            >
              ➕
            </button>
          </div>
          
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  selectedConversationId === conversation._id
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className="flex-shrink-0">
                  {getConversationIcon(conversation)}
                </div>
                <span className="truncate font-medium">
                  {getConversationName(conversation)}
                </span>
                {getUnreadCount(conversation._id) > 0 && (
                  <div className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {getUnreadCount(conversation._id)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Panel */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              {currentUser?.profile?.avatarUrl ? (
                <img
                  src={currentUser.profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </button>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(currentUser?.profile?.status || "offline")}`}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-white truncate">
                {currentUser?.profile?.displayName}
              </span>
              {currentUser?.profile?.verified && (
                <span className="verification-check">✓</span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                {getStatusText(currentUser?.profile?.status || "offline")} ▼
              </button>
              
              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded-lg border border-gray-600 py-1 min-w-[150px] z-10">
                  <button
                    onClick={() => handleStatusChange("online")}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 rounded-full status-online"></div>
                    <span>Online</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange("away")}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 rounded-full status-away"></div>
                    <span>Away</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange("dnd")}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 rounded-full status-dnd"></div>
                    <span>Do Not Disturb</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange("offline")}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 rounded-full status-offline"></div>
                    <span>Invisible</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => window.dispatchEvent(new Event('signOut'))}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Sign Out"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          userId={currentUser._id}
          onClose={() => setShowProfile(false)}
          isOwnProfile={true}
        />
      )}
    </div>
  );
}

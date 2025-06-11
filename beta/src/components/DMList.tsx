import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface DMListProps {
  selectedDMId: Id<"directMessages"> | null;
  onSelectDM: (dmId: Id<"directMessages">) => void;
}

export function DMList({ selectedDMId, onSelectDM }: DMListProps) {
  const dms = useQuery(api.directMessages.getUserDMs) || [];

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      <div className="flex items-center px-2 py-1 text-xs font-semibold text-discord-muted uppercase tracking-wide mb-2">
        Direct Messages
      </div>
      
      {dms.length === 0 ? (
        <div className="px-2 py-4 text-discord-muted text-sm">
          No direct messages yet. Start a conversation with a friend!
        </div>
      ) : (
        <div className="space-y-1">
          {dms.map((dm) => (
            <div
              key={dm._id}
              className={`flex items-center px-2 py-2 mx-1 rounded cursor-pointer transition-colors ${
                selectedDMId === dm._id
                  ? "bg-discord-selected text-white"
                  : "text-discord-muted hover:bg-discord-hover hover:text-discord-hover-text"
              }`}
              onClick={() => onSelectDM(dm._id)}
            >
              <div className="relative mr-3">
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center">
                  {dm.otherUser.profile?.avatarUrl ? (
                    <img
                      src={dm.otherUser.profile.avatarUrl}
                      alt={dm.otherUser.profile?.displayName || dm.otherUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-xs">
                      {(dm.otherUser.profile?.displayName || dm.otherUser.name || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {dm.otherUser.profile?.status === "online" && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-discord-green rounded-full border-2 border-discord-dark"></div>
                )}
                {dm.otherUser.profile?.status === "idle" && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-discord-yellow rounded-full border-2 border-discord-dark"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {dm.otherUser.profile?.displayName || dm.otherUser.name}
                  </span>
                  {dm.lastMessageAt && (
                    <span className="text-xs text-discord-muted ml-2">
                      {formatTime(dm.lastMessageAt)}
                    </span>
                  )}
                </div>
                {dm.lastMessage && (
                  <div className="text-xs text-discord-muted truncate">
                    {dm.lastMessage.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

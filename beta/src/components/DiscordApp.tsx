import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ServerList } from "./ServerList";
import { ChannelList } from "./ChannelList";
import { ChatArea } from "./ChatArea";
import { UserArea } from "./UserArea";
import { DMList } from "./DMList";
import { FriendsList } from "./FriendsList";
import { ServerSettings } from "./ServerSettings";
import { Id } from "../../convex/_generated/dataModel";

type ViewType = "server" | "friends" | "dm";

export function DiscordApp() {
  const [viewType, setViewType] = useState<ViewType>("server");
  const [selectedServerId, setSelectedServerId] = useState<Id<"servers"> | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [selectedDMId, setSelectedDMId] = useState<Id<"directMessages"> | null>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);
  
  const servers = useQuery(api.servers.getUserServers) || [];
  const channels = useQuery(
    api.servers.getServerChannels,
    selectedServerId ? { serverId: selectedServerId } : "skip"
  ) || [];

  // Auto-select first server and channel
  if (viewType === "server" && servers.length > 0 && !selectedServerId && servers[0]) {
    setSelectedServerId(servers[0]._id);
  }
  
  if (viewType === "server" && channels.length > 0 && !selectedChannelId) {
    const textChannel = channels.find(c => c.type === "text");
    if (textChannel) {
      setSelectedChannelId(textChannel._id);
    }
  }

  const selectedServer = servers.find(s => s && s._id === selectedServerId);
  const selectedChannel = channels.find(c => c._id === selectedChannelId);

  const handleServerSelect = (serverId: Id<"servers">) => {
    setViewType("server");
    setSelectedServerId(serverId);
    setSelectedChannelId(null);
    setSelectedDMId(null);
  };

  const handleDMSelect = (dmId: Id<"directMessages">) => {
    setViewType("dm");
    setSelectedDMId(dmId);
    setSelectedServerId(null);
    setSelectedChannelId(null);
  };

  const handleFriendsView = () => {
    setViewType("friends");
    setSelectedServerId(null);
    setSelectedChannelId(null);
    setSelectedDMId(null);
  };

  return (
    <>
      <div className="flex h-screen bg-discord-dark">
        {/* Server List */}
        <div className="w-18 bg-discord-darker flex flex-col items-center py-3 space-y-2">
          <ServerList 
            servers={servers.filter((s): s is NonNullable<typeof s> => s !== null)}
            selectedServerId={selectedServerId}
            onSelectServer={handleServerSelect}
            onSelectFriends={handleFriendsView}
            viewType={viewType}
          />
        </div>

        {/* Channel/DM List */}
        <div className="w-60 bg-discord-dark flex flex-col">
          <div className="h-12 px-4 flex items-center justify-between border-b border-discord-border shadow-sm">
            <h2 className="font-semibold text-white truncate">
              {viewType === "server" && selectedServer?.name}
              {viewType === "friends" && "Friends"}
              {viewType === "dm" && "Direct Messages"}
            </h2>
            
            {viewType === "server" && selectedServer && (
              <button
                onClick={() => setShowServerSettings(true)}
                className="p-1 text-discord-muted hover:text-white transition-colors"
                title="Server Settings"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
              </button>
            )}
          </div>
          
          {viewType === "server" && (
            <ChannelList 
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
            />
          )}
          
          {viewType === "friends" && <FriendsList />}
          
          {viewType === "dm" && (
            <DMList 
              selectedDMId={selectedDMId}
              onSelectDM={handleDMSelect}
            />
          )}
          
          <UserArea />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {viewType === "server" && selectedChannelId ? (
            <ChatArea 
              channelId={selectedChannelId}
              channelName={selectedChannel?.name || ""}
              type="channel"
            />
          ) : viewType === "dm" && selectedDMId ? (
            <ChatArea 
              dmId={selectedDMId}
              type="dm"
            />
          ) : viewType === "friends" ? (
            <div className="flex-1 flex items-center justify-center text-discord-muted">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Friends</h3>
                <p>Manage your friends and see who's online</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-discord-muted">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Welcome to Nevelose</h3>
                <p>Select a channel or start a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Server Settings Modal */}
      {showServerSettings && selectedServerId && (
        <ServerSettings
          serverId={selectedServerId}
          onClose={() => setShowServerSettings(false)}
        />
      )}
    </>
  );
}

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ServerList } from "./ServerList";
import { ChannelList } from "./ChannelList";
import { ChatArea } from "./ChatArea";
import { UserArea } from "./UserArea";
import { DMList } from "./DMList";
import { FriendsList } from "./FriendsList";
import { Id } from "../../convex/_generated/dataModel";

type ViewType = "server" | "friends" | "dm";

export function DiscordApp() {
  const [viewType, setViewType] = useState<ViewType>("server");
  const [selectedServerId, setSelectedServerId] = useState<Id<"servers"> | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [selectedDMId, setSelectedDMId] = useState<Id<"directMessages"> | null>(null);
  
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
        <div className="h-12 px-4 flex items-center border-b border-discord-border shadow-sm">
          <h2 className="font-semibold text-white truncate">
            {viewType === "server" && selectedServer?.name}
            {viewType === "friends" && "Friends"}
            {viewType === "dm" && "Direct Messages"}
          </h2>
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
  );
}

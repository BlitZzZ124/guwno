import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Channel {
  _id: Id<"channels">;
  name: string;
  type: "text" | "voice";
}

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: Id<"channels"> | null;
  onSelectChannel: (channelId: Id<"channels">) => void;
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel }: ChannelListProps) {
  const textChannels = channels.filter(c => c.type === "text");
  const voiceChannels = channels.filter(c => c.type === "voice");

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {/* Text Channels */}
      {textChannels.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center px-2 py-1 text-xs font-semibold text-discord-muted uppercase tracking-wide">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2z"/>
            </svg>
            Text Channels
          </div>
          {textChannels.map((channel) => (
            <div
              key={channel._id}
              className={`flex items-center px-2 py-1 mx-1 rounded cursor-pointer transition-colors ${
                selectedChannelId === channel._id
                  ? "bg-discord-selected text-white"
                  : "text-discord-muted hover:bg-discord-hover hover:text-discord-hover-text"
              }`}
              onClick={() => onSelectChannel(channel._id)}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z"/>
              </svg>
              <span className="text-sm font-medium">{channel.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Voice Channels */}
      {voiceChannels.length > 0 && (
        <div>
          <div className="flex items-center px-2 py-1 text-xs font-semibold text-discord-muted uppercase tracking-wide">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            Voice Channels
          </div>
          {voiceChannels.map((channel) => (
            <VoiceChannel key={channel._id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceChannel({ channel }: { channel: Channel }) {
  const voiceUsers = useQuery(api.voice.getVoiceChannelUsers, { channelId: channel._id }) || [];

  return (
    <div className="mb-2">
      <div className="flex items-center px-2 py-1 mx-1 rounded cursor-pointer text-discord-muted hover:bg-discord-hover hover:text-discord-hover-text transition-colors">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        <span className="text-sm font-medium">{channel.name}</span>
        {voiceUsers.length > 0 && (
          <span className="ml-auto text-xs bg-discord-blurple text-white px-1 rounded">
            {voiceUsers.length}
          </span>
        )}
      </div>
      
      {/* Voice channel users */}
      {voiceUsers.length > 0 && (
        <div className="ml-6 space-y-1">
          {voiceUsers.filter(user => user !== null).map((user) => (
            <div key={user._id} className="flex items-center px-2 py-1 text-discord-muted text-sm">
              <div className="w-4 h-4 rounded-full bg-discord-green mr-2 flex-shrink-0">
                {user.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt={user.profile?.displayName || user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-xs flex items-center justify-center w-full h-full">
                    {(user.profile?.displayName || user.name || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="truncate">{user.profile?.displayName || user.name}</span>
              {user.voiceState?.muted && (
                <svg className="w-3 h-3 ml-1 text-discord-red" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

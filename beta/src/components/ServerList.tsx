import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface Server {
  _id: Id<"servers">;
  _creationTime: number;
  name: string;
  ownerId: Id<"users">;
  inviteCode: string;
  icon?: Id<"_storage">;
  iconUrl: string | null;
}

interface ServerListProps {
  servers: Server[];
  selectedServerId: Id<"servers"> | null;
  onSelectServer: (serverId: Id<"servers">) => void;
  onSelectFriends: () => void;
  viewType: "server" | "friends" | "dm";
}

export function ServerList({ servers, selectedServerId, onSelectServer, onSelectFriends, viewType }: ServerListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const createServer = useMutation(api.servers.createServer);

  const handleCreateServer = async (name: string) => {
    await createServer({ name });
    setShowCreateModal(false);
  };

  return (
    <>
      {/* Home/DM Button */}
      <div className="relative group">
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
            viewType === "friends" || viewType === "dm"
              ? "bg-discord-blurple rounded-2xl"
              : "bg-discord-blurple hover:bg-discord-blurple-hover hover:rounded-2xl"
          }`}
          onClick={onSelectFriends}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.4-.4.8-.54 1.25a16.87 16.87 0 0 0-5.16 0c-.14-.45-.33-.85-.54-1.25-1.61.27-3.14.75-4.6 1.44A19.04 19.04 0 0 0 .96 17.7a18.43 18.43 0 0 0 5.63 2.87c.46-.62.86-1.28 1.2-1.98-.65-.25-1.29-.55-1.9-.92.17-.12.32-.24.47-.37 3.58 1.7 7.7 1.7 11.28 0l.46.37c-.6.36-1.25.67-1.9.92.34.7.74 1.36 1.2 1.98a18.43 18.43 0 0 0 5.63-2.87 19.05 19.05 0 0 0-2.33-12.83zM8.3 15.12c-1.1 0-2-1.02-2-2.27 0-1.24.88-2.26 2-2.26s2.02 1.02 2 2.26c0 1.25-.89 2.27-2 2.27zm7.4 0c-1.1 0-2-1.02-2-2.27 0-1.24.88-2.26 2-2.26s2.02 1.02 2 2.26c0 1.25-.88 2.27-2 2.27z"/>
          </svg>
        </div>
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Direct Messages
        </div>
      </div>

      <div className="w-8 h-0.5 bg-discord-border rounded-full mx-auto"></div>

      {/* Server Icons */}
      {servers.map((server) => (
        <div key={server._id} className="relative group">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
              selectedServerId === server._id
                ? "bg-discord-blurple rounded-2xl"
                : "bg-discord-light hover:bg-discord-blurple hover:rounded-2xl"
            }`}
            onClick={() => onSelectServer(server._id)}
          >
            {server.iconUrl ? (
              <img
                src={server.iconUrl}
                alt={server.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-lg">
                {server.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {server.name}
          </div>
        </div>
      ))}

      {/* Add Server Button */}
      <div className="relative group">
        <div
          className="w-12 h-12 bg-discord-light hover:bg-discord-green rounded-full flex items-center justify-center cursor-pointer transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          <svg className="w-6 h-6 text-discord-green group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
        </div>
      </div>

      {/* Join Server Button */}
      <div className="relative group">
        <div
          className="w-12 h-12 bg-discord-light hover:bg-discord-blurple rounded-full flex items-center justify-center cursor-pointer transition-colors"
          onClick={() => setShowJoinModal(true)}
        >
          <svg className="w-6 h-6 text-discord-blurple group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      </div>

      {/* Create Server Modal */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateServer}
        />
      )}

      {/* Join Server Modal */}
      {showJoinModal && (
        <JoinServerModal
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </>
  );
}

function CreateServerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [serverName, setServerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverName.trim()) {
      onCreate(serverName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-light rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold text-white mb-4">Create a server</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-discord-muted text-sm font-medium mb-2">
              SERVER NAME
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full px-3 py-2 bg-discord-darker text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none"
              placeholder="Enter server name"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-discord-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!serverName.trim()}
              className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinServerModal({ onClose }: { onClose: () => void }) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const joinServer = useMutation(api.invites.joinServerByInvite);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      await joinServer({ inviteCode: inviteCode.trim() });
      onClose();
    } catch (error) {
      console.error("Failed to join server:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-light rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold text-white mb-4">Join a server</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-discord-muted text-sm font-medium mb-2">
              INVITE CODE
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 bg-discord-darker text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none"
              placeholder="Enter invite code"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-discord-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim() || loading}
              className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Joining..." : "Join Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

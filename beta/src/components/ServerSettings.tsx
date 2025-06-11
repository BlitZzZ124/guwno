import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ServerSettingsProps {
  serverId: Id<"servers">;
  onClose: () => void;
}

export function ServerSettings({ serverId, onClose }: ServerSettingsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [serverName, setServerName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const iconInputRef = useRef<HTMLInputElement>(null);
  
  const server = useQuery(api.servers.getServerDetails, { serverId });
  const updateServer = useMutation(api.servers.updateServer);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const deleteServer = useMutation(api.servers.deleteServer);

  // Initialize form values when server loads
  useState(() => {
    if (server) {
      setServerName(server.name || "");
      setDescription(server.description || "");
    }
  });

  const handleIconUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      await updateServer({
        serverId,
        icon: storageId,
      });
    } catch (error) {
      console.error("Failed to upload icon:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    await updateServer({
      serverId,
      name: serverName || undefined,
      description: description || undefined,
    });
  };

  const handleDeleteServer = async () => {
    if (confirm("Are you sure you want to delete this server? This action cannot be undone.")) {
      await deleteServer({ serverId });
      onClose();
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "roles", label: "Roles", icon: "👥" },
    { id: "channels", label: "Channels", icon: "📺" },
    { id: "members", label: "Members", icon: "👤" },
    { id: "invites", label: "Invites", icon: "🔗" },
    { id: "moderation", label: "Moderation", icon: "🛡️" },
  ];

  if (!server) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg w-full max-w-4xl h-5/6 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 bg-discord-darker p-4">
          <div className="mb-6">
            <h2 className="text-white font-semibold text-lg">{server.name}</h2>
            <p className="text-discord-muted text-sm">Server Settings</p>
          </div>
          
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  activeTab === tab.id
                    ? "bg-discord-blurple text-white"
                    : "text-discord-muted hover:text-white hover:bg-discord-hover"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-4 border-t border-discord-border">
            <button
              onClick={onClose}
              className="text-discord-muted hover:text-white transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Server Overview</h3>
                
                {/* Server Icon */}
                <div className="mb-6">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    SERVER ICON
                  </label>
                  <div className="flex items-center">
                    <div className="relative mr-4">
                      <div className="w-20 h-20 rounded-full bg-discord-blurple flex items-center justify-center">
                        {server.iconUrl ? (
                          <img
                            src={server.iconUrl}
                            alt="Server Icon"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-2xl">
                            {server.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => iconInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-discord-blurple rounded-full flex items-center justify-center text-white text-xs hover:bg-discord-blurple-hover transition-colors"
                        disabled={uploading}
                      >
                        ✏️
                      </button>
                    </div>
                    <div>
                      <p className="text-discord-muted text-sm">
                        We recommend an image of at least 512x512 for the server.
                      </p>
                    </div>
                  </div>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconUpload(file);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Server Name */}
                <div className="mb-4">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    SERVER NAME
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    className="w-full px-3 py-2 bg-discord-input text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none"
                    placeholder="Enter server name"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    DESCRIPTION
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-discord-input text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none resize-none"
                    rows={3}
                    placeholder="Help others discover your server by describing what makes it special"
                    maxLength={120}
                  />
                  <div className="text-discord-muted text-xs mt-1">
                    {description.length}/120
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-discord-green hover:bg-green-600 text-white rounded transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleDeleteServer}
                    className="px-4 py-2 bg-discord-red hover:bg-red-600 text-white rounded transition-colors"
                  >
                    Delete Server
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Server Members</h3>
                <div className="bg-discord-light rounded-lg p-4">
                  <p className="text-discord-muted">Member management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Roles</h3>
                <div className="bg-discord-light rounded-lg p-4">
                  <p className="text-discord-muted">Role management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "channels" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Channels</h3>
                <div className="bg-discord-light rounded-lg p-4">
                  <p className="text-discord-muted">Channel management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "invites" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Invites</h3>
                <div className="bg-discord-light rounded-lg p-4">
                  <div className="mb-4">
                    <label className="block text-discord-muted text-sm font-medium mb-2">
                      INVITE CODE
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={server.inviteCode}
                        readOnly
                        className="flex-1 px-3 py-2 bg-discord-input text-white rounded border border-discord-border"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(server.inviteCode)}
                        className="px-3 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "moderation" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Moderation</h3>
                <div className="bg-discord-light rounded-lg p-4">
                  <p className="text-discord-muted">Moderation tools coming soon...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

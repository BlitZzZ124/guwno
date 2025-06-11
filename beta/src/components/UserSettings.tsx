import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UserSettingsProps {
  onClose: () => void;
}

export function UserSettings({ onClose }: UserSettingsProps) {
  const [activeTab, setActiveTab] = useState("account");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const user = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getUserProfile, {});
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  // Initialize form values when profile loads
  useState(() => {
    if (profile?.profile) {
      setDisplayName(profile.profile.displayName || "");
      setBio(profile.profile.bio || "");
      setCustomStatus(profile.profile.customStatus || "");
    }
  });

  const handleFileUpload = async (file: File, type: "avatar" | "banner") => {
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
      
      await updateProfile({
        [type]: storageId,
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    await updateProfile({
      displayName: displayName || undefined,
      bio: bio || undefined,
      customStatus: customStatus || undefined,
    });
  };

  const tabs = [
    { id: "account", label: "My Account", icon: "👤" },
    { id: "profile", label: "User Profile", icon: "🎨" },
    { id: "privacy", label: "Privacy & Safety", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg w-full max-w-4xl h-5/6 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 bg-discord-darker p-4">
          <div className="mb-6">
            <h2 className="text-white font-semibold text-lg">User Settings</h2>
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
          {activeTab === "account" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">My Account</h3>
                
                <div className="bg-discord-light rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="relative mr-4">
                      <div className="w-20 h-20 rounded-full bg-discord-blurple flex items-center justify-center">
                        {profile?.profile?.avatarUrl ? (
                          <img
                            src={profile.profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-2xl">
                            {(profile?.profile?.displayName || user?.name || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-discord-blurple rounded-full flex items-center justify-center text-white text-xs hover:bg-discord-blurple-hover transition-colors"
                        disabled={uploading}
                      >
                        ✏️
                      </button>
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {profile?.profile?.displayName || user?.name}
                      </div>
                      <div className="text-discord-muted text-sm">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "avatar");
                  }}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">User Profile</h3>
                
                {/* Banner */}
                <div className="mb-6">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    BANNER
                  </label>
                  <div className="relative">
                    <div className="w-full h-32 bg-discord-blurple rounded-lg overflow-hidden">
                      {profile?.profile?.bannerUrl ? (
                        <img
                          src={profile.profile.bannerUrl}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-discord-blurple to-purple-600"></div>
                      )}
                    </div>
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="absolute top-2 right-2 px-3 py-1 bg-black bg-opacity-50 text-white rounded text-sm hover:bg-opacity-70 transition-colors"
                      disabled={uploading}
                    >
                      Change Banner
                    </button>
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "banner");
                    }}
                    className="hidden"
                  />
                </div>

                {/* Display Name */}
                <div className="mb-4">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    DISPLAY NAME
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-discord-input text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none"
                    placeholder="Enter display name"
                  />
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    ABOUT ME
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-discord-input text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none resize-none"
                    rows={3}
                    placeholder="Tell us about yourself"
                    maxLength={190}
                  />
                  <div className="text-discord-muted text-xs mt-1">
                    {bio.length}/190
                  </div>
                </div>

                {/* Custom Status */}
                <div className="mb-6">
                  <label className="block text-discord-muted text-sm font-medium mb-2">
                    CUSTOM STATUS
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-discord-input text-white rounded border border-discord-border focus:border-discord-blurple focus:outline-none"
                    placeholder="Set a custom status"
                    maxLength={128}
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-discord-green hover:bg-green-600 text-white rounded transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Privacy & Safety</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-discord-light rounded">
                    <div>
                      <div className="text-white font-medium">Allow direct messages from server members</div>
                      <div className="text-discord-muted text-sm">This setting is applied to all servers</div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-discord-light rounded">
                    <div>
                      <div className="text-white font-medium">Allow friend requests</div>
                      <div className="text-discord-muted text-sm">Allow others to send you friend requests</div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-discord-light rounded">
                    <div>
                      <div className="text-white font-medium">Enable desktop notifications</div>
                      <div className="text-discord-muted text-sm">Get notified when you receive messages</div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-discord-light rounded">
                    <div>
                      <div className="text-white font-medium">Enable push notifications</div>
                      <div className="text-discord-muted text-sm">Get push notifications on mobile</div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

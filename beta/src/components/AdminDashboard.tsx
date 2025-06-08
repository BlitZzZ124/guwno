import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "badges" | "emojis">("users");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [badgeName, setBadgeName] = useState("");
  const [badgeImageUrl, setBadgeImageUrl] = useState("");
  const [badgeDescription, setBadgeDescription] = useState("");
  const [emojiName, setEmojiName] = useState("");
  const [emojiImageUrl, setEmojiImageUrl] = useState("");

  const allUsers = useQuery(api.users.getAllUsers);
  const customEmojis = useQuery(api.users.getCustomEmojis);
  const banUser = useMutation(api.users.banUser);
  const verifyUser = useMutation(api.users.verifyUser);
  const addBadgeToUser = useMutation(api.users.addBadgeToUser);
  const removeBadgeFromUser = useMutation(api.users.removeBadgeFromUser);
  const addCustomEmoji = useMutation(api.users.addCustomEmoji);
  const removeCustomEmoji = useMutation(api.users.removeCustomEmoji);

  const validUsers = (allUsers?.filter(Boolean) || []) as any[];

  const handleBanUser = async (userId: Id<"users">, banned: boolean) => {
    try {
      await banUser({ userId, banned });
      toast.success(banned ? "User banned successfully" : "User unbanned successfully");
    } catch (error) {
      toast.error("Failed to update ban status");
    }
  };

  const handleVerifyUser = async (userId: Id<"users">, verified: boolean) => {
    try {
      await verifyUser({ userId, verified });
      toast.success(verified ? "User verified successfully" : "User unverified successfully");
    } catch (error) {
      toast.error("Failed to update verification status");
    }
  };

  const handleAddBadge = async () => {
    if (!selectedUserId || !badgeName || !badgeImageUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addBadgeToUser({
        userId: selectedUserId,
        badge: {
          name: badgeName,
          imageUrl: badgeImageUrl,
          description: badgeDescription || undefined,
        },
      });
      toast.success("Badge added successfully");
      setBadgeName("");
      setBadgeImageUrl("");
      setBadgeDescription("");
      setSelectedUserId(null);
    } catch (error) {
      toast.error("Failed to add badge");
    }
  };

  const handleRemoveBadge = async (userId: Id<"users">, badgeName: string) => {
    try {
      await removeBadgeFromUser({ userId, badgeName });
      toast.success("Badge removed successfully");
    } catch (error) {
      toast.error("Failed to remove badge");
    }
  };

  const handleAddEmoji = async () => {
    if (!emojiName || !emojiImageUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addCustomEmoji({
        name: emojiName,
        imageUrl: emojiImageUrl,
      });
      toast.success("Custom emoji added successfully");
      setEmojiName("");
      setEmojiImageUrl("");
    } catch (error) {
      toast.error("Failed to add custom emoji");
    }
  };

  const handleRemoveEmoji = async (emojiId: Id<"customEmojis">) => {
    try {
      await removeCustomEmoji({ emojiId });
      toast.success("Custom emoji removed successfully");
    } catch (error) {
      toast.error("Failed to remove custom emoji");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "users"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("badges")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "badges"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Badge Management
          </button>
          <button
            onClick={() => setActiveTab("emojis")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "emojis"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Emoji Management
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "users" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">All Users</h3>
              {validUsers.map((user: any) => (
                <div key={user._id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                        {user.profile?.avatarUrl ? (
                          <img
                            src={user.profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {user.profile?.displayName}
                          </span>
                          {user.profile?.verified && (
                            <span className="verification-check">✓</span>
                          )}
                          {user.profile?.badges?.map((badge: any, index: number) => (
                            <img
                              key={index}
                              src={badge.imageUrl}
                              alt={badge.name}
                              title={badge.description || badge.name}
                              className="w-4 h-4"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{user.profile?.username} • {user._id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerifyUser(user._id, !user.profile?.verified)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          user.profile?.verified
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                        }`}
                      >
                        {user.profile?.verified ? "Verified" : "Verify"}
                      </button>
                      <button
                        onClick={() => handleBanUser(user._id, !user.profile?.banned)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          user.profile?.banned
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-yellow-600 text-white hover:bg-yellow-700"
                        }`}
                      >
                        {user.profile?.banned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "badges" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Add Badge to User</h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select User
                    </label>
                    <select
                      value={selectedUserId || ""}
                      onChange={(e) => setSelectedUserId(e.target.value as Id<"users">)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select a user...</option>
                      {validUsers.map((user: any) => (
                        <option key={user._id} value={user._id}>
                          {user.profile?.displayName} (@{user.profile?.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Badge Name *
                    </label>
                    <input
                      type="text"
                      value={badgeName}
                      onChange={(e) => setBadgeName(e.target.value)}
                      placeholder="e.g., Developer, Moderator, VIP"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Badge Image URL *
                    </label>
                    <input
                      type="url"
                      value={badgeImageUrl}
                      onChange={(e) => setBadgeImageUrl(e.target.value)}
                      placeholder="https://i.imgur.com/badge.png"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Badge Description
                    </label>
                    <input
                      type="text"
                      value={badgeDescription}
                      onChange={(e) => setBadgeDescription(e.target.value)}
                      placeholder="Optional description for the badge"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddBadge}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Badge
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Manage User Badges</h3>
                {validUsers.filter((user: any) => user.profile?.badges && user.profile.badges.length > 0).map((user: any) => (
                  <div key={user._id} className="bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                        {user.profile?.avatarUrl ? (
                          <img
                            src={user.profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-sm">👤</span>
                        )}
                      </div>
                      <span className="font-medium text-white">
                        {user.profile?.displayName} (@{user.profile?.username})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {user.profile?.badges?.map((badge: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-gray-600 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <img
                              src={badge.imageUrl}
                              alt={badge.name}
                              className="w-4 h-4"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="text-white">{badge.name}</span>
                            {badge.description && (
                              <span className="text-gray-400 text-sm">- {badge.description}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveBadge(user._id, badge.name)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "emojis" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Add Custom Emoji</h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emoji Name *
                    </label>
                    <input
                      type="text"
                      value={emojiName}
                      onChange={(e) => setEmojiName(e.target.value)}
                      placeholder="e.g., cat, fire, heart"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Users will type :{emojiName}: to use this emoji
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emoji Image URL *
                    </label>
                    <input
                      type="url"
                      value={emojiImageUrl}
                      onChange={(e) => setEmojiImageUrl(e.target.value)}
                      placeholder="https://i.imgur.com/emoji.png"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {emojiImageUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Preview
                      </label>
                      <img
                        src={emojiImageUrl}
                        alt="Emoji preview"
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleAddEmoji}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Emoji
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Custom Emojis ({customEmojis?.length || 0})
                </h3>
                {customEmojis && customEmojis.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customEmojis.map((emoji: any) => (
                      <div key={emoji._id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={emoji.imageUrl}
                              alt={emoji.name}
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div>
                              <div className="text-white font-medium">:{emoji.name}:</div>
                              <div className="text-gray-400 text-sm">{emoji.name}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveEmoji(emoji._id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No custom emojis added yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

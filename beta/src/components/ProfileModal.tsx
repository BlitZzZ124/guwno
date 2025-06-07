import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ProfileModalProps {
  userId: Id<"users">;
  onClose: () => void;
  isOwnProfile?: boolean;
}

export function ProfileModal({ userId, onClose, isOwnProfile = false }: ProfileModalProps) {
  const userProfile = useQuery(api.users.getUserProfile, { userId });
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Initialize form when user data loads
  useEffect(() => {
    if (userProfile?.profile) {
      setDisplayName(userProfile.profile.displayName || "");
      setAvatarUrl(userProfile.profile.avatarUrl || "");
      setBannerUrl(userProfile.profile.bannerUrl || "");
      setAboutMe(userProfile.profile.aboutMe || "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        aboutMe: aboutMe.trim() || undefined,
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    toast.success("User ID copied to clipboard!");
    setShowMenu(false);
  };

  if (!userProfile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg overflow-hidden">
          {(isEditing ? bannerUrl : userProfile.profile?.bannerUrl) && (
            <img
              src={isEditing ? bannerUrl : userProfile.profile?.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-600 border-4 border-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 -mt-12 relative z-10">
              {(isEditing ? avatarUrl : userProfile.profile?.avatarUrl) ? (
                <img
                  src={isEditing ? avatarUrl : userProfile.profile?.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div className="flex-1 mt-4">
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-bold text-white bg-gray-700 border border-gray-600 rounded px-3 py-1 w-full"
                  placeholder="Display Name"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">
                    {userProfile.profile?.displayName}
                  </h1>
                  {userProfile.profile?.verified && (
                    <span className="text-blue-500 text-xl" title="Verified">✓</span>
                  )}
                </div>
              )}
              <p className="text-gray-400">@{userProfile.profile?.username}</p>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              {/* Three dots menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  ⋯
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg z-20">
                    <button
                      onClick={copyUserId}
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Copy User ID
                    </button>
                  </div>
                )}
              </div>
              
              {isOwnProfile && (
                <div>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://i.imgur.com/example.jpg"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Banner URL
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://i.imgur.com/banner.gif"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* About Me Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">About Me</h2>
            {isEditing ? (
              <textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            ) : (
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300">
                  {userProfile.profile?.aboutMe || "No description provided."}
                </p>
              </div>
            )}
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {userProfile.profile?.status === "online" ? "🟢" : 
                 userProfile.profile?.status === "away" ? "🟡" : "⚫"}
              </div>
              <div className="text-sm text-gray-400 capitalize">
                {userProfile.profile?.status || "offline"}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {userProfile.profile?.lastSeen ? 
                  new Date(userProfile.profile.lastSeen).toLocaleDateString() : 
                  "Never"
                }
              </div>
              <div className="text-sm text-gray-400">Last Seen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

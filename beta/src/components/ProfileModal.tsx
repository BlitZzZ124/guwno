import { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name?: string;
  email?: string;
  profile?: {
    displayName?: string;
    bio?: string;
    status?: string;
    customStatus?: string;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
  } | null;
}

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

export function ProfileModal({ user, onClose }: ProfileModalProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online": return "bg-discord-green";
      case "idle": return "bg-discord-yellow";
      case "dnd": return "bg-discord-red";
      case "invisible": return "bg-gray-500";
      default: return "bg-discord-green";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "online": return "Online";
      case "idle": return "Idle";
      case "dnd": return "Do Not Disturb";
      case "invisible": return "Invisible";
      default: return "Online";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-discord-dark rounded-lg w-80 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-discord-blurple to-purple-600 relative">
          {user.profile?.bannerUrl && (
            <img
              src={user.profile.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-4 pt-0">
          {/* Avatar */}
          <div className="relative -mt-8 mb-4">
            <div className="w-16 h-16 rounded-full bg-discord-blurple flex items-center justify-center border-4 border-discord-dark">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-xl">
                  {(user.profile?.displayName || user.name || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-discord-dark ${getStatusColor(user.profile?.status)}`}></div>
          </div>

          {/* User Info */}
          <div className="mb-4">
            <h3 className="text-white font-semibold text-lg">
              {user.profile?.displayName || user.name}
            </h3>
            <div className="text-discord-muted text-sm">
              {user.name}
            </div>
          </div>

          {/* Status */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(user.profile?.status)} mr-2`}></div>
              <span className="text-white text-sm font-medium">
                {getStatusText(user.profile?.status)}
              </span>
            </div>
            {user.profile?.customStatus && (
              <div className="text-discord-muted text-sm">
                {user.profile.customStatus}
              </div>
            )}
          </div>

          {/* Bio */}
          {user.profile?.bio && (
            <div className="mb-4">
              <h4 className="text-white font-medium text-sm mb-2">ABOUT ME</h4>
              <div className="text-discord-muted text-sm">
                {user.profile.bio}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="mb-4">
            <h4 className="text-white font-medium text-sm mb-2">DISCORD MEMBER SINCE</h4>
            <div className="text-discord-muted text-sm">
              {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded text-sm transition-colors">
              Send Message
            </button>
            <button className="px-3 py-2 bg-discord-light hover:bg-discord-lighter text-white rounded text-sm transition-colors">
              More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

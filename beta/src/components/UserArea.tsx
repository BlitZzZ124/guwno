import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { UserSettings } from "./UserSettings";
import { ProfileModal } from "./ProfileModal";

export function UserArea() {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getUserProfile, {});
  const updateProfile = useMutation(api.profiles.updateProfile);
  const { signOut } = useAuthActions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (status: "online" | "idle" | "dnd" | "invisible") => {
    await updateProfile({ status });
    setShowStatusDropdown(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online": return "bg-discord-green";
      case "idle": return "bg-discord-yellow";
      case "dnd": return "bg-discord-red";
      case "invisible": return "bg-gray-500";
      default: return "bg-discord-green";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "dnd":
        return (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        );
      case "idle":
        return (
          <div className="w-1 h-1 bg-white rounded-full"></div>
        );
      case "invisible":
        return (
          <div className="w-2 h-2 border border-white rounded-full"></div>
        );
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="h-14 bg-discord-darker px-2 flex items-center justify-between border-t border-discord-border">
        <div 
          className="flex items-center flex-1 min-w-0 p-1 rounded hover:bg-discord-hover cursor-pointer transition-colors"
          onClick={() => setShowProfile(true)}
        >
          <div className="relative mr-2">
            <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center">
              {profile?.profile?.avatarUrl ? (
                <img
                  src={profile.profile.avatarUrl}
                  alt={profile.profile?.displayName || user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {(profile?.profile?.displayName || user.name || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div 
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker flex items-center justify-center ${getStatusColor(profile?.profile?.status)}`}
            >
              {getStatusIcon(profile?.profile?.status)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">
              {profile?.profile?.displayName || user.name}
            </div>
            <div className="text-discord-muted text-xs truncate">
              {profile?.profile?.customStatus || profile?.profile?.status || "Online"}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Microphone */}
          <button className="p-1 text-discord-muted hover:text-white hover:bg-discord-hover rounded transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>

          {/* Headphones */}
          <button className="p-1 text-discord-muted hover:text-white hover:bg-discord-hover rounded transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
            </svg>
          </button>

          {/* Settings */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className="p-1 text-discord-muted hover:text-white hover:bg-discord-hover rounded transition-colors"
              onClick={() => setShowSettings(true)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Status Dropdown */}
      {showStatusDropdown && (
        <div className="absolute bottom-16 left-2 right-2 bg-discord-darkest rounded-lg p-2 shadow-lg z-50">
          <div className="space-y-1">
            {[
              { status: "online", label: "Online", color: "bg-discord-green" },
              { status: "idle", label: "Idle", color: "bg-discord-yellow" },
              { status: "dnd", label: "Do Not Disturb", color: "bg-discord-red" },
              { status: "invisible", label: "Invisible", color: "bg-gray-500" },
            ].map(({ status, label, color }) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as any)}
                className="w-full flex items-center px-2 py-1 text-left hover:bg-discord-hover rounded text-white transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                {label}
              </button>
            ))}
          </div>
          <div className="border-t border-discord-border mt-2 pt-2">
            <button
              onClick={() => signOut()}
              className="w-full text-left px-2 py-1 text-discord-red hover:bg-discord-hover rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <UserSettings onClose={() => setShowSettings(false)} />
      )}

      {/* Profile Modal */}
      {showProfile && profile && (
        <ProfileModal 
          user={profile} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </>
  );
}

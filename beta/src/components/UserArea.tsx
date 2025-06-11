import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";

export function UserArea() {
  const [showSettings, setShowSettings] = useState(false);
  const user = useQuery(api.profiles.getUserProfile, {});

  if (!user) return null;

  return (
    <div className="h-14 bg-discord-darker px-2 flex items-center justify-between border-t border-discord-border">
      <div className="flex items-center min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center mr-2 flex-shrink-0">
          {user.profile?.avatarUrl ? (
            <img
              src={user.profile.avatarUrl}
              alt={user.profile.displayName || user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-xs">
              {(user.profile?.displayName || user.name || "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">
            {user.profile?.displayName || user.name}
          </div>
          <div className="text-xs text-discord-muted truncate">
            {user.profile?.customStatus || `#${user.email?.split('@')[0] || '0000'}`}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          className="w-8 h-8 flex items-center justify-center text-discord-muted hover:text-white hover:bg-discord-hover rounded transition-colors"
          title="Mute"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-discord-muted hover:text-white hover:bg-discord-hover rounded transition-colors"
          title="Deafen"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-discord-muted hover:text-white hover:bg-discord-hover rounded transition-colors"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </div>

      {showSettings && (
        <div className="absolute bottom-16 left-2 bg-discord-light rounded-lg shadow-lg p-2 min-w-48 z-50">
          <SignOutButton />
        </div>
      )}
    </div>
  );
}

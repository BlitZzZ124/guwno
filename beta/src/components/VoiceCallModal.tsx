import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface VoiceCallModalProps {
  conversationId: Id<"conversations">;
  onClose: () => void;
}

export function VoiceCallModal({ conversationId, onClose }: VoiceCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const currentUser = useQuery(api.users.getCurrentUser);
  const voiceCall = useQuery(api.voiceCalls.getActiveCall, { conversationId });
  const joinCall = useMutation(api.voiceCalls.joinCall);
  const leaveCall = useMutation(api.voiceCalls.leaveCall);
  const updateCallSettings = useMutation(api.voiceCalls.updateCallSettings);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        await joinCall({ conversationId });
        setIsConnecting(false);
        toast.success("Connected to voice call");
      } catch (error) {
        toast.error("Failed to join voice call");
        onClose();
      }
    };

    initializeCall();
  }, [conversationId, joinCall, onClose]);

  const handleLeaveCall = async () => {
    try {
      await leaveCall({ conversationId });
      onClose();
    } catch (error) {
      toast.error("Failed to leave call");
    }
  };

  const handleToggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    try {
      await updateCallSettings({
        conversationId,
        muted: newMutedState,
        deafened: isDeafened,
      });
    } catch (error) {
      toast.error("Failed to update settings");
      setIsMuted(!newMutedState);
    }
  };

  const handleToggleDeafen = async () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    // If deafening, also mute
    if (newDeafenedState) {
      setIsMuted(true);
    }
    try {
      await updateCallSettings({
        conversationId,
        muted: newDeafenedState || isMuted,
        deafened: newDeafenedState,
      });
    } catch (error) {
      toast.error("Failed to update settings");
      setIsDeafened(!newDeafenedState);
    }
  };

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Connecting to voice call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Voice Call</h2>
          <p className="text-gray-400">
            {voiceCall?.participants.length || 1} participant(s) in call
          </p>
        </div>

        {/* Participants */}
        <div className="mb-6 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {voiceCall?.participants.map((participant) => (
              <div
                key={participant.userId}
                className="bg-gray-700 rounded-lg p-3 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                  {participant.user?.profile?.avatarUrl ? (
                    <img
                      src={participant.user.profile.avatarUrl}
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
                <div className="text-sm text-white font-medium truncate">
                  {participant.userId === currentUser?._id 
                    ? "You" 
                    : participant.user?.profile?.displayName || "User"}
                </div>
                <div className="flex justify-center space-x-1 mt-1">
                  {participant.muted && (
                    <span className="text-red-400 text-xs">🔇</span>
                  )}
                  {participant.deafened && (
                    <span className="text-red-400 text-xs">🔇</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handleToggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            <span className="text-white text-lg">
              {isMuted ? "🔇" : "🎤"}
            </span>
          </button>

          <button
            onClick={handleToggleDeafen}
            className={`p-3 rounded-full transition-colors ${
              isDeafened
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            title={isDeafened ? "Undeafen" : "Deafen"}
          >
            <span className="text-white text-lg">
              {isDeafened ? "🔇" : "🔊"}
            </span>
          </button>

          <button
            onClick={handleLeaveCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="Leave Call"
          >
            <span className="text-white text-lg">📞</span>
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Minimize
          </button>
        </div>
      </div>
    </div>
  );
}

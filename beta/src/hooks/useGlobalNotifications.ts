import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useGlobalNotifications(currentUser: any) {
  const allConversations = useQuery(api.conversations.getUserConversations);
  const lastMessageCounts = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!allConversations || !currentUser) return;

    // Check each conversation for new messages
    allConversations.forEach(async (conversation) => {
      try {
        const messages = await fetch(`/api/messages/${conversation._id}`).then(r => r.json()).catch(() => []);
        const currentCount = messages.length || 0;
        const lastCount = lastMessageCounts.current[conversation._id] || 0;

        if (currentCount > lastCount && lastCount > 0) {
          const latestMessage = messages[messages.length - 1];
          if (latestMessage && latestMessage.senderId !== currentUser._id) {
            // Play notification sound
            if (!currentUser.profile?.doNotDisturb) {
              const audio = new Audio('https://nevelose.xyz/files/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {
                // Fallback beep sound
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.frequency.value = 800;
                  gain.gain.value = 0.1;
                  osc.start();
                  osc.stop(ctx.currentTime + 0.1);
                } catch (e) {}
              });
            }
          }
        }

        lastMessageCounts.current[conversation._id] = currentCount;
      } catch (error) {
        // Ignore errors
      }
    });
  }, [allConversations, currentUser]);
}

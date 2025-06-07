import { useState } from "react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  customEmojis: Array<{ name: string; imageUrl: string }>;
}

export function EmojiPicker({ onEmojiSelect, onClose, customEmojis }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "custom">("standard");

  const standardEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
    "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
    "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
    "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏",
    "🙌", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
    "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
    "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
    "🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💣", "💬",
    "🗨️", "🗯️", "💭", "💤", "👋", "🤚", "🖐️", "✋", "🖖", "👌"
  ];

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded-lg border border-gray-600 p-3 w-80 max-h-64 overflow-hidden z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("standard")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === "standard"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === "custom"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Custom ({customEmojis.length})
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto max-h-48">
        {activeTab === "standard" ? (
          <div className="grid grid-cols-8 gap-1">
            {standardEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => onEmojiSelect(emoji)}
                className="p-2 hover:bg-gray-600 rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {customEmojis.length > 0 ? (
              customEmojis.map((emoji) => (
                <button
                  key={emoji.name}
                  onClick={() => onEmojiSelect(`:${emoji.name}:`)}
                  className="p-2 hover:bg-gray-600 rounded transition-colors flex flex-col items-center"
                  title={`:${emoji.name}:`}
                >
                  <img
                    src={emoji.imageUrl}
                    alt={emoji.name}
                    className="w-6 h-6 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                    {emoji.name}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-6 text-center text-gray-400 py-4">
                No custom emojis available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

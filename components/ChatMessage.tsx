import React from "react";

interface ChatMessageProps {
  sender: string;
  message: string;
  isOwnMessage: boolean;
  timestamp?: number;
  imageDataUrl?: string;
}

const ChatMessage = ({
  sender,
  message,
  isOwnMessage,
  timestamp,
  imageDataUrl,
}: ChatMessageProps) => {
  const isSystemMessage = sender === "system";
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return (
    <div
      className={`flex ${
        isSystemMessage
          ? "justify-center"
          : isOwnMessage
          ? "justify-end"
          : "justify-start"
      } mb-3`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isSystemMessage
            ? "bg-gray-800 text-white text-center text-xs"
            : isOwnMessage
            ? "bg-blue-500 text-white"
            : "bg-white text-black"
        }`}
      >
        {!isSystemMessage && <p className="text-sm font-bold">{sender}</p>}
        {imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageDataUrl}
            alt="uploaded"
            className="max-w-xs rounded mb-1"
          />
        )}
        {message && <p>{message}</p>}
        {!isSystemMessage && timeStr && (
          <p className="mt-1 text-[10px] text-gray-500 text-right">{timeStr}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

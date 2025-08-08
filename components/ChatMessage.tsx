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
        className={`max-w-[80%] px-4 py-2 rounded-lg break-words ${
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
            className="rounded mb-1 max-w-[240px] max-h-[240px] w-auto h-auto object-contain"
          />
        )}
        {message && (
          <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
        )}
        {!isSystemMessage && timeStr && (
          <p className="mt-1 text-[11px] text-gray-600/90 text-right">
            {timeStr}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

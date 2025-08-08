"use client";

import React, { useState } from "react";

const ChatForm = ({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) => {
  const [message, setMessage] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 px-4 border-2 border-gray-300 py-2 rounded-lg focus:outline-none focus:border-blue-400"
        placeholder="여기에 메세지를 입력하세요..."
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        전송
      </button>
    </form>
  );
};

export default ChatForm;

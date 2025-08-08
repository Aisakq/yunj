"use client";

import React, { useRef, useState } from "react";

const ChatForm = ({
  onSend,
}: {
  onSend: (message: string, imageDataUrl?: string) => void;
}) => {
  const [message, setMessage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    undefined
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "" && !imageDataUrl) return;
    onSend(message, imageDataUrl);
    setMessage("");
    setImageDataUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4 items-center">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 px-4 border-2 border-gray-300 py-2 rounded-lg focus:outline-none focus:border-blue-400"
        placeholder="여기에 메세지를 입력하세요..."
      />
      <label className="cursor-pointer bg-gray-100 border-2 border-gray-300 text-gray-700 px-3 py-2 rounded-lg">
        사진
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              setImageDataUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
          }}
        />
      </label>
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

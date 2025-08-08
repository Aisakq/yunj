"use client";

import ChatForm from "@/components/ChatForm";
import ChatMessage from "@/components/ChatMessage";
import { socket } from "@/lib/socktClient";
import { useEffect, useState } from "react";

export default function Home() {
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<
    {
      sender: string;
      message: string;
      timestamp?: number;
      imageDataUrl?: string;
    }[]
  >([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    socket.on(
      "history",
      (history: { sender: string; message: string; timestamp?: number }[]) => {
        setMessages(history);
      }
    );
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on(
      "export",
      (payload: {
        filename: string;
        mimeType: string;
        content: string;
        encoding?: string; // base64
      }) => {
        try {
          const { filename, mimeType, content, encoding } = payload;
          let blob: Blob;
          if (encoding === "base64") {
            const byteChars = atob(content);
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
              byteNumbers[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: mimeType });
          } else {
            blob = new Blob([content], { type: mimeType });
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (e) {
          // noop
        }
      }
    );

    socket.on("user_joined", (message) => {
      setMessages((prev) => [
        ...prev,
        { sender: "system", message, timestamp: Date.now() },
      ]);
    });

    socket.on("user_left", (message) => {
      setMessages((prev) => [
        ...prev,
        { sender: "system", message, timestamp: Date.now() },
      ]);
    });

    return () => {
      socket.off("history");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("message");
      socket.off("export");
    };
  }, []);
  const handleJoinRoom = () => {
    if (room && userName) {
      socket.emit("join-room", { room, username: userName });
    }
    setJoined(true);
  };
  const handleSend = (message: string, imageDataUrl?: string) => {
    const payload = { room, message, sender: userName, imageDataUrl };
    const local = {
      sender: userName,
      message,
      timestamp: Date.now(),
      imageDataUrl,
    };
    setMessages((prev) => [...prev, local]);
    socket.emit("message", payload);
  };
  return (
    <div className="flex mt-24 justify-center w-full">
      {!joined ? (
        <div className="flex w-full max-w-3xl mx-auto flex-col items-center">
          <h1 className="mb-4 text-2xl font-bold">채팅 입장</h1>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-64 px-4 py-2 mb-4 border-2 border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="채팅방 이름을 입력하세요"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-64 px-4 py-2 mb-4 border-2 border-gray-300 rounded-lg"
          />
          <button
            onClick={handleJoinRoom}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg"
          >
            채팅 입장
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Yunj Archive | {room}</h1>
            <button
              onClick={async () => {
                const resp = await fetch("/export-all");
                if (!resp.ok) return;
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "chats_export.zip";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 text-sm bg-gray-800 text-white rounded"
              title="모든 채팅방을 각각 Excel로 내보내기"
            >
              전체 내보내기 (ZIP)
            </button>
          </div>
          <div className="h-[500px] overflow-y-auto p-4 mb-4 bg-gray-100 border border-gray-300 rounded-lg">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                sender={msg.sender}
                message={msg.message}
                isOwnMessage={msg.sender === userName}
                timestamp={msg.timestamp}
                imageDataUrl={msg.imageDataUrl}
              />
            ))}
          </div>
          <ChatForm onSend={handleSend} />
        </div>
      )}
    </div>
  );
}

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

type ChatMessage = { sender: string; message: string };
const MAX_HISTORY_PER_ROOM = 200;
const roomToMessages: Map<string, ChatMessage[]> = new Map();
const socketToUser: Map<string, { room: string; username: string }> = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    ["http://localhost:3000", "http://localhost", "https://localhost"].join(",")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log(`유저 연결: ${socket.id}`);

    socket.on("join-room", ({ room, username }) => {
      socket.join(room);
      console.log(`${username}가 ${room}에 입장`);
      socket.to(room).emit("user_joined", `${username}이 채팅에 입장`);
      socketToUser.set(socket.id, { room, username });

      // 방 히스토리 초기화 및 전송
      const history = roomToMessages.get(room) ?? [];
      roomToMessages.set(room, history);
      socket.emit("history", history);
    });

    socket.on("message", ({ room, message, sender }) => {
      console.log(`${sender}가 ${room}에 메세지를 보냄: ${message}`);
      // 서버 메모리에 메시지 저장
      const history = roomToMessages.get(room) ?? [];
      history.push({ sender, message });
      // 히스토리 개수 제한
      if (history.length > MAX_HISTORY_PER_ROOM) {
        history.splice(0, history.length - MAX_HISTORY_PER_ROOM);
      }
      roomToMessages.set(room, history);

      // 본인 제외 룸에 브로드캐스트
      socket.to(room).emit("message", { sender, message });
    });

    socket.on("disconnect", () => {
      console.log(`유저 연결 해제: ${socket.id}`);
      const info = socketToUser.get(socket.id);
      if (info) {
        const { room, username } = info;
        socket.to(room).emit("user_left", `${username}이 채팅을 떠남`);
        socketToUser.delete(socket.id);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server running on http://${hostname}:${port}`);
  });
});

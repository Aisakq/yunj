import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import JSZip from "jszip";
import * as XLSX from "xlsx";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

type ChatMessage = {
  sender: string;
  message: string;
  timestamp: number;
  imageDataUrl?: string;
};
const MAX_HISTORY_PER_ROOM = 200;
const roomToMessages: Map<string, ChatMessage[]> = new Map();
const socketToUser: Map<string, { room: string; username: string }> = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    if (req.url && req.method === "GET" && req.url.startsWith("/export-all")) {
      try {
        const zip = new JSZip();
        // 방별 메시지를 각각 Excel로 만들어 zip에 추가
        for (const [room, history] of roomToMessages.entries()) {
          const rows: Array<[string, string, string, string]> = [
            ["시간", "보낸사람", "메시지", "이미지"],
          ];
          for (const m of history) {
            const ts = new Date(m.timestamp).toLocaleString("ko-KR", {
              hour12: false,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            rows.push([
              ts,
              m.sender,
              m.message ?? "",
              m.imageDataUrl ? "첨부" : "",
            ]);
          }
          const worksheet = XLSX.utils.aoa_to_sheet(rows);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "채팅");
          const xlsxBuffer: Buffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer",
          }) as unknown as Buffer;
          const safeRoom = String(room).replace(/[^a-zA-Z0-9._-]+/g, "_");
          zip.file(`room_${safeRoom}.xlsx`, xlsxBuffer);
        }
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=chats_export.zip"
        );
        res.end(zipBuffer);
        return;
      } catch (e) {
        res.statusCode = 500;
        res.end("Export failed");
        return;
      }
    }
    return handle(req, res);
  });
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

    socket.on(
      "message",
      ({
        room,
        message,
        sender,
        imageDataUrl,
      }: {
        room: string;
        message: string;
        sender: string;
        imageDataUrl?: string;
      }) => {
        console.log(`${sender}가 ${room}에 메세지를 보냄: ${message}`);
        // 관리자 명령: '/save-all' → 모든 방을 각각 엑셀로 ZIP 생성하여 보낸 사용자에게만 전송
        if (
          room === "Dev" &&
          sender === "aisakq" &&
          message &&
          message.trim() === "/save-all"
        ) {
          try {
            const zip = new JSZip();
            for (const [r, history] of roomToMessages.entries()) {
              const rows: Array<[string, string, string, string]> = [
                ["시간", "보낸사람", "메시지", "이미지"],
              ];
              for (const m of history) {
                const ts = new Date(m.timestamp).toLocaleString("ko-KR", {
                  hour12: false,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                rows.push([
                  ts,
                  m.sender,
                  m.message ?? "",
                  m.imageDataUrl ? "첨부" : "",
                ]);
              }
              const worksheet = XLSX.utils.aoa_to_sheet(rows);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, "채팅");
              const xlsxBuffer: Buffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "buffer",
              }) as unknown as Buffer;
              const safeRoom = String(r).replace(/[^a-zA-Z0-9._-]+/g, "_");
              zip.file(`room_${safeRoom}.xlsx`, xlsxBuffer);
            }
            zip
              .generateAsync({ type: "nodebuffer" })
              .then((zipBuffer: Buffer) => {
                socket.emit("export", {
                  filename: "chats_export.zip",
                  mimeType: "application/zip",
                  encoding: "base64",
                  content: zipBuffer.toString("base64"),
                });
              })
              .catch(() => {
                socket.emit("export", {
                  filename: "error.txt",
                  mimeType: "text/plain;charset=utf-8",
                  content: "Export failed",
                });
              });
          } catch (e) {
            socket.emit("export", {
              filename: "error.txt",
              mimeType: "text/plain;charset=utf-8",
              content: "Export failed",
            });
          }
          return;
        }
        // 서버 메모리에 메시지 저장
        const history = roomToMessages.get(room) ?? [];
        const msgObj: ChatMessage = {
          sender,
          message,
          timestamp: Date.now(),
          imageDataUrl,
        };
        history.push(msgObj);
        // 히스토리 개수 제한
        if (history.length > MAX_HISTORY_PER_ROOM) {
          history.splice(0, history.length - MAX_HISTORY_PER_ROOM);
        }
        roomToMessages.set(room, history);

        // 본인 제외 룸에 브로드캐스트
        socket.to(room).emit("message", msgObj);
      }
    );

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

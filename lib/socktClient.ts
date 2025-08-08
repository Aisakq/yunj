"use client";

import { io } from "socket.io-client";
const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const socket = io(socketUrl, {
  transports: ["websocket", "polling"],
});

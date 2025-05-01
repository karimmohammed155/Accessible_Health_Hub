import { Server } from "socket.io";

export let io = null;
export const init_socket = (server) => {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) socket.join(userId);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};

import { Server } from "socket.io";

const setup_socket = (server) => {
  const io = new Server(server, { cors: "*" });

  io.on("connection", (socket) => {
    console.log(socket.id);
    console.log("user connected");
  });
  return io;
};

export default setup_socket;

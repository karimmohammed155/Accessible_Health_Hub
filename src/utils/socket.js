import { Server } from "socket.io";

let io = null;

export const init_socket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  return io;
};

export const get_socket = () => {
  return io;
};

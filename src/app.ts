import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { socketServer } from "./socket";


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// start socket
socketServer(io);

httpServer.listen(3001, () =>{
  console.log("Starting server at port 3001");
});

export { io };
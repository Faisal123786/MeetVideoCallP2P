import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();
const roomOwners = new Map();

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("join_room", (data) => {
    emailToSocketIdMap.set(data.email, socket.id);
    socketIdToEmailMap.set(socket.id, data.email);

    const ownerEmail = roomOwners.get(data.roomId);
    if (!ownerEmail) {
      roomOwners.set(data.roomId, data.email);
      socket.join(data.roomId);
      socket.emit("room_joined", { roomId: data.roomId, isOwner: true });
    } else {
      socket.emit("wait_for_admit", { roomId: data.roomId });
      const ownerSocketId = emailToSocketIdMap.get(ownerEmail);
      if (ownerSocketId) {
        io.to(ownerSocketId).emit("admit_request", {
          roomId: data.roomId,
          email: data.email,
        });
      }
    }
  });

  socket.on("admitted", ({ roomId, email }) => {
  const userSocketId = emailToSocketIdMap.get(email);

  if (userSocketId) {
    
    io.sockets.sockets.get(userSocketId)?.join(roomId);
    io.to(userSocketId).emit("room_joined", {
      roomId,
      isOwner: false,
    });
    socket.to(roomId).emit("user_joined", { email });
  }
});

socket.on("call_user", ({ offer, email }) => {
  const userSocketId = emailToSocketIdMap.get(email);
  if (userSocketId) {
    io.to(userSocketId).emit("call_made", { offer, email: socketIdToEmailMap.get(socket.id) });
  }
});

socket.on("make_answer", ({ answer, email }) => {
  const userSocketId = emailToSocketIdMap.get(email);
  if (userSocketId) {
    io.to(userSocketId).emit("answer_made", { answer, email: socketIdToEmailMap.get(socket.id) });
  }
});

socket.on("ice_candidate", ({ candidate, email }) => {
    const targetSocketId = emailToSocketIdMap.get(email);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice_candidate", { candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});



server.listen(8000, () => console.log("Server running on port 8000"));

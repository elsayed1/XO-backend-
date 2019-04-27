const express = require("express");
const app = express();
const server = require("http").Server(app);

const io = require("socket.io").listen(server);

app.get("/", (req, res) => {
  res.end("hellooo");
});
let rooms = 0;

io.on("connection", socket => {
  console.log("user connected ", socket.id);
  // Create a new game room and notify the creator of game.
  socket.on("create game", player1 => {
    socket.join(`room-${++rooms}`);
    socket.emit("new game", {
      player1,
      roomName: `room-${rooms}`
    });
  });

  // Connect the Player 2 to the room he requested. Show error if room full.
  socket.on("join game", data => {
    var room = io.nsps["/"].adapter.rooms[data.roomName];
    if (room && room.length === 1) {
      socket.join(data.roomName);
      socket.broadcast.to(data.roomName).emit("player1", {});
      console.log(data.player2);
      socket.emit("player2", {
        player2: data.player2,
        roomName: data.roomName
      });
    } else {
      socket.emit("err", {
        message: "Sorry, The room is full!"
      });
    }
  });

  // Handle the turn played by either player and notify the other.
  socket.on("playTurn", data => {
    socket.broadcast.to(data.room).emit("turnPlayed", {
      tile: data.tile,
      room: data.room
    });
  });

  /**
   * Notify the players about the victor.
   */
  socket.on("gameEnded", data => {
    socket.broadcast.to(data.room).emit("gameEnd", data);
  });
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log("server is runnig on port" + port));

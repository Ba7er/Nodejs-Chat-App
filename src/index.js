const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')



const app = express();
const server = http.createServer(app);//below line is done automatically by express
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");// setting the public directory and adding html file to served
app.use(express.static(publicDirectoryPath));//using express static to tell where our html file exist



io.on("connection", socket => {
  console.log("new Web socket connection");

  socket.on('join', (options, callback)=>{
    const {error, user} = addUser({id: socket.id, ...options})

    if(error){
      return callback(error)
    }
    
    socket.join(user.room)

    socket.emit("message", generateMessage('Admin','Welcome!'));
    socket.broadcast.to(user.room).emit("message", generateMessage('Admin',`${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })


  socket.on("SendMessage", (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed ");
    }
    io.to(user.room).emit("message", generateMessage(user.username,message));
    callback();
  });



  socket.on("SendLocation", (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      "locationMessage", generateLocationMessage(user.username,`https://google.com/maps?q=${coords.lat},${coords.long}`))
      callback()

  });

  


  // when user disconnect send a message to all other connected user that one user left.
  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if(user){
      io.to(user.room).emit("message", generateMessage('Admin',`${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});



server.listen(port, () => {
  console.log("server is running at port  ", port);
});

 - Broadcasting rooms to all users
   - For every connection been made, store them inside an array and emit the array to the connected user
 
  - Socket Instance API
   - socket.to(anotherSocketID).emit() = send a direct conenction to the other user connected


  Sample
  create a room
   create an object
    {
      socketId: string,
      roomNumber: number,
      roomName: string,
      isPrivate: boolean,
      password?: string
    }
  
once the object is created, emit it on the "room" channel
the room channel will broadcast the object to all users
then the user's client will store the object to the store


when the user tries to join the room, the client side will emit to the socketId of the room

on the server side, we are expecting something like

socket.on("room entering", ( roomSocketIdToEnter) =>{
  socket.to(roomSocketIdToEnter).emit(")
})

on the client side, we are expectint something like:
 io.on("room entering", () =>{

 })
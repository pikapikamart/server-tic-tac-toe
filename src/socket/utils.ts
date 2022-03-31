import { Server, Socket } from "socket.io";
import { 
  Room,
  InitialRoom,
  RoomType } from ".";
import { EVENTS } from "./events";


export class GameRooms {
  roomChannels: Room[]

  constructor () {
    this.roomChannels = [];
  }

  filteredRoomChannels(): InitialRoom[] {
    const filteredRooms = this.roomChannels.filter(room => !room.isActive );
    const availableRooms = filteredRooms.map(room =>{
      const { password, ownerSocket, joinerSocket, nextRound, ...rest } = room;

      return rest;
    })

    return availableRooms;
  }

  findRoom( roomType: RoomType, item: string | number) {
    switch(roomType) {
      case "room":
        return this.roomChannels.find(room => room.roomId===item);
      case "socket":
        return this.roomChannels.find(room => room.ownerSocket.id===item)
    }
  }

  checkAndAddRoom( roomType: RoomType, socketId: string, room: Room ) {
    const foundRoom = this.findRoom(roomType, socketId);

    if ( !foundRoom ) {
      this.roomChannels.push(room)
    }
  }

  removeRoom( io: Server, socket:Socket, roomId?: number ) {
    const assumedRoomIndex = roomId? 
      this.roomChannels.findIndex(item => item.roomId===roomId) : 
      this.roomChannels.findIndex(item => item.joinerSocket?.id===socket.id || item.ownerSocket.id===socket.id);

    if ( assumedRoomIndex===-1 ) return;

    const room = this.roomChannels[assumedRoomIndex];

    // no joiner, the owner is the leaver
    if ( !room.joinerSocket ) {
      this.roomChannels.splice(assumedRoomIndex, 1);
      
      return socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, this.filteredRoomChannels());
    }

    // currently in middle of game
    if ( room.isActive ) {
      const playerId = socket.id===room.joinerSocket.id? room.ownerSocket.id : room.joinerSocket.id;

      io.in(playerId).emit(EVENTS.SERVER.GAME_PLAYER_EXIT, socket.id);
      io.in(playerId).socketsLeave(`${room.roomId}`);
      this.roomChannels.splice(assumedRoomIndex, 1);

      return socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, this.filteredRoomChannels());
    }

    // the owner is the leaver but with request to the room
    if ( room.ownerSocket.id === socket.id ) {

      this.roomChannels.splice(assumedRoomIndex, 1);

      io.to(room.joinerSocket.id).emit(EVENTS.SERVER.JOIN_REQUEST, { 
        success: false,
        message: "",
        exited: true
       });

      return socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, this.filteredRoomChannels());
    }
    
    // joiner is the leaver of the room with a request to it
    if ( room.joinerSocket ) {
      room.joinerSocket = null;

      io.to(room.ownerSocket.id).emit(EVENTS.SERVER.ROOM_REQUEST, false, true);
    }
  }
}
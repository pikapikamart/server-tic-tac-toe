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
      const { password, ownerSocket, joinerSocket, currentPlayer, ...rest } = room;

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

  removeRoom( io: Server, socket:Socket ) {
    const assumedUserRoomIndex = this.roomChannels.findIndex(item => item.ownerSocket.id===socket.id);

    if ( assumedUserRoomIndex!==-1 ) {
      const room = this.roomChannels[assumedUserRoomIndex];

      if ( room.joinerSocket ) {
        io.in(room.joinerSocket.id).socketsLeave(`${room.roomId}`);
    }

    this.roomChannels.splice(assumedUserRoomIndex, 1);
  }
  
    socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, this.filteredRoomChannels());
  }

  checkRoomValidity() {

  }
}
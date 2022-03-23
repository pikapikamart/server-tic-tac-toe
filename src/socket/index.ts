import { Server, Socket } from "socket.io";
import { EVENTS } from "./events";


type InitialRoom = {
  roomId: number,
  roomTitle: string,
  isPrivate: boolean,
  isActive: boolean,
  password?: string
}

type Player = "X" | "O";

type Room = InitialRoom & {
  ownerSocket: Socket,
  joinerSocket?: Socket | null,
  currentPlayer?: Player
}

interface RoomRequest {
  roomId: number,
  password?: string
}

type RoomType = "room" | "socket";

interface StartGameProps {
  started: boolean,
  room: InitialRoom
}

interface OnGoingGameProps {
  player: Player,
  move: number,
  roomId: string
}

const roomChannels: Room[] = [];

const filteredRoomChannels = ( rooms: Room[]) =>{
  const filteredRooms = rooms.map(room =>{
    const { password, ownerSocket, joinerSocket, currentPlayer, ...rest } = room;

    if ( !rest.isActive ) {
      return rest;
    }

    return false;
  });

  return filteredRooms;
}

const findRoom = ( roomType: RoomType, item: string | number ) =>{
  switch(roomType) {
    case "room":
      return roomChannels.find(room => room.roomId===item);
    case "socket":
      return roomChannels.find(room => room.ownerSocket.id===item);
  }
}

const checkAndAddRoom = ( roomType: RoomType, room: Room, socketId: string ) =>{
  const foundRoom = findRoom(roomType, socketId);

  if ( !foundRoom ) {
    roomChannels.push(room);
  }
}

const socketServer = (io: Server) =>{
  
  io.on(EVENTS.connection, socket => {

    socket.emit(EVENTS.SERVER.AVAILABLE_ROOMS, filteredRoomChannels(roomChannels));

    socket.on(EVENTS.CLIENT.CREATE_ROOM, ( room: InitialRoom ) =>{
      const newRoom: Room = Object.assign(room, { ownerSocket: socket, isActive: false });

      checkAndAddRoom("socket", newRoom, socket.id);

      socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, filteredRoomChannels(roomChannels));
    })

    socket.on(EVENTS.CLIENT.JOIN_ROOM, ( request: RoomRequest ) =>{
      const room = findRoom("room", request.roomId);

      if ( room ) {
        if ( room.joinerSocket ) {
          socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "Someone is already joining.", success: false });
        } 

        if ( room.isPrivate && room.password!==request.password ) {
          socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "Wrong password.", success: false });
        } 
        
        else {
          socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "Request sent.", success: true });
          socket.to(room.ownerSocket.id).emit(EVENTS.SERVER.ROOM_REQUEST, true);
          room.joinerSocket = socket;
        }
      }
      
      else {
        socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "No room found.", success: false });
      }
    })

    socket.on(EVENTS.CLIENT.START_GAME, ( started: "false" | "true", room: InitialRoom ) =>{
      const gameRoom = findRoom("room", room.roomId);

      if ( gameRoom && gameRoom.joinerSocket ) {
        if ( started==="true" ) {
          const ownerMark = Math.random() < .5? "X" : "O";
          const joinerMark = ownerMark==="X"? "O" : "X";
          const initialGameState = {
            started,
            ownerMark,
            joinerMark,
            roomId: gameRoom.roomId
          }
          gameRoom.ownerSocket.join(`${gameRoom.roomId}`);
          gameRoom.joinerSocket?.join(`${gameRoom.roomId}`);
          gameRoom.isActive = true;
          gameRoom.currentPlayer = "X";

          io.to(`${room.roomId}`).emit(EVENTS.SERVER.GAME_START, initialGameState);
          io.emit(EVENTS.SERVER.AVAILABLE_ROOMS, filteredRoomChannels(roomChannels));
        }

        else {
          socket.to(gameRoom.joinerSocket?.id).emit(EVENTS.SERVER.GAME_START, false);
          gameRoom.joinerSocket = null;
        }
      }
    })

    socket.on(EVENTS.CLIENT.ONGOING_GAME, ( { player, move, roomId }: OnGoingGameProps ) =>{
      const gameRoom = findRoom("room", roomId) as Room;

      
    })

    socket.on(EVENTS.disconnect, () =>{
      const assumedUserRoomIndex = roomChannels.findIndex(item => item.ownerSocket.id===socket.id);

      if ( assumedUserRoomIndex!==-1 ) {
        const room = roomChannels[assumedUserRoomIndex];

        if ( room.joinerSocket ) {
          io.in(room.joinerSocket.id).socketsLeave(`${room.roomId}`);
        }
        roomChannels.splice(assumedUserRoomIndex, 1);
      }
      
      socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, filteredRoomChannels(roomChannels));
    })
  })

}

export { socketServer };
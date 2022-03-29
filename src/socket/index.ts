import { Server, Socket } from "socket.io";
import { EVENTS } from "./events";
import { GameRooms } from "./utils";


export type InitialRoom = {
  roomId: number,
  roomTitle: string,
  isPrivate: boolean,
  isActive: boolean,
  password?: string
}

type Player = "X" | "O";

export type Room = InitialRoom & {
  ownerSocket: Socket,
  nextRound: {
    [ key: string]: boolean,
    X: boolean,
    O: boolean
  },
  joinerSocket?: Socket | null
}

interface RoomRequest {
  roomId: number,
  password?: string
}

interface GameAddMoveProps {
  move: number,
  player: Player,
  roomId?: number
}

export type RoomType = "room" | "socket";

const gameRooms = new GameRooms();

const socketServer = (io: Server) =>{
  
  io.on(EVENTS.connection, socket => {

    socket.on(EVENTS.CLIENT.SERVE_ROOMS, () => socket.emit(EVENTS.SERVER.AVAILABLE_ROOMS, gameRooms.filteredRoomChannels()))

    socket.on(EVENTS.CLIENT.CREATE_ROOM, ( room: InitialRoom ) =>{
      const newRoom: Room = Object.assign(
        room,
        { 
          ownerSocket: socket, 
          nextRound: {
            X: false,
            O: false
          },
          isActive: false });

      gameRooms.checkAndAddRoom("socket", socket.id, newRoom);

      socket.broadcast.emit(EVENTS.SERVER.AVAILABLE_ROOMS, gameRooms.filteredRoomChannels());
    })

    socket.on(EVENTS.CLIENT.CANCEL_ROOM, () => gameRooms.removeRoom(io, socket))

    socket.on(EVENTS.CLIENT.JOIN_ROOM, ( request: RoomRequest ) =>{
      const room = gameRooms.findRoom("room", request.roomId);

      if ( room ) {
        if ( room.joinerSocket ) {
          socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "Someone is already joining.", success: false });
        } 

        else if ( room.isPrivate && room.password!==request.password ) {
          socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "Wrong password.", success: false });
        } 
        
        else {
          socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "Request sent.", success: true });
          io.to(room.ownerSocket.id).emit(EVENTS.SERVER.ROOM_REQUEST, true);
          room.joinerSocket = socket;
        }
      }
      
      else {
        socket.emit(EVENTS.SERVER.JOIN_REQUEST, { message: "No room found.", success: false });
      }
    })

    socket.on(EVENTS.CLIENT.START_GAME, ( started: boolean, roomId: number ) =>{
      const gameRoom = gameRooms.findRoom("room", roomId);

      if ( gameRoom && gameRoom.joinerSocket ) {
        if ( started ) {
          const ownerMark = Math.random() < .5? "X" : "O";
          const joinerMark = ownerMark==="X"? "O" : "X";
          const initialGameState = {
            ownerMark,
            joinerMark,
            roomId: gameRoom.roomId
          }
          gameRoom.ownerSocket.join(`${gameRoom.roomId}`);
          gameRoom.joinerSocket?.join(`${gameRoom.roomId}`);
          gameRoom.isActive = true;

          io.to(`${gameRoom.roomId}`).emit(EVENTS.SERVER.GAME_START, initialGameState);
          io.emit(EVENTS.SERVER.AVAILABLE_ROOMS, gameRooms.filteredRoomChannels());
        }

        else {
          socket.to(gameRoom.joinerSocket?.id).emit(EVENTS.SERVER.GAME_START, false);
          gameRoom.joinerSocket = null;
        }
      }
    })

    socket.on(EVENTS.CLIENT.GAME_ADD_MOVE, ( { move, player, roomId }: GameAddMoveProps ) =>{
      if ( roomId ) {  
        socket.to(`${roomId}`).emit(EVENTS.SERVER.GAME_RECEIVE_MOVE, move, player );
      }
    })

    socket.on(EVENTS.CLIENT.GAME_REQUEST_NEXT_ROUND, ( player: Player, roomId: number ) =>{
      const room = gameRooms.findRoom("room", roomId);

      if ( room ) {
        room.nextRound[player] = true;

        if ( room.nextRound.X && room.nextRound.O ) {
          io.to(`${ roomId }`).emit(EVENTS.SERVER.GAME_START_NEXT_ROUND);
          room.nextRound.O = false;
          room.nextRound.X = false;
        }
      }
    })

    socket.on(EVENTS.CLIENT.EXIT_ONLINE, () => socket.disconnect())

    socket.on(EVENTS.disconnect, () => gameRooms.removeRoom(io, socket))
  })

}

export { socketServer };
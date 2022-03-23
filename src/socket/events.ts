

// Client events is what client emits
// Server events is what server emits
export const EVENTS = {
  connection: "connection",
  disconnect: "disconnect",
  CLIENT: {
    CREATE_ROOM: "CREATE_ROOM",
    JOIN_ROOM: "JOIN_ROOM",
    START_GAME: "START_GAME",
    ONGOING_GAME: "ONGOING_GAME"
  },
  SERVER: {
    AVAILABLE_ROOMS: "AVAILABLE_ROOMS",
    JOIN_REQUEST: "JOIN_REQUEST",
    ROOM_REQUEST: "ROOM_REQUEST",
    GAME_START: "GAME_START"
  }
};

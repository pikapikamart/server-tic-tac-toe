// import { createServer, Server as HTTPServer } from "http";
// import { AddressInfo } from "net";
// import { Server, Socket } from "socket.io";
// import { io, Socket as CSocket } from "socket.io-client";


// let ioServer: Server, httpServer: HTTPServer, port: number;
// let client1: CSocket, client2: CSocket;

// beforeAll((done) =>{
//   httpServer = createServer().listen();
//   port = (httpServer.address() as AddressInfo).port;
//   ioServer = new Server(httpServer);

//   done();
// })

// afterAll((done) =>{
//   ioServer.close();
//   httpServer.close();

//   done();
// })

// beforeEach((done) =>{
//   client1 = io(`http://localhost:${port}`);
//   client2 = io(`http://localhost:${port}`);

//   client1.on("connect", () =>{});
//   client2.on("connect", () =>{
//     if ( client1.connected) done();
//   })
// })

// afterEach((done) =>{
//   if ( client1.connected ) client1.disconnect();
//   if ( client2.connected) client2.disconnect();

//   done();
// })

// test("Should work on initial", (done) =>{
//   console.log(client1.id);
//   console.log(client2.id);

//   client1.on("test", arg =>{
//     expect(arg).toBe("wold");
    
//   })

//   ioServer.emit('test', "world");
  

// })

import WebSocket, { Server } from 'ws'

type Message = DatalessMessage | TimeupdateMessage | IdentifyMessage | CreateRoomMessage | JoinRoomMessage | MessageMessage
type ActionName = DatalessAction | TimeupdateAction | IdentifyAction | CreateRoomAction | JoinRoomAction | MessageAction

type DatalessAction = 'get-room-list' | 'play' | 'pause'
interface DatalessMessage {
  action: DatalessAction
}

type TimeupdateAction = 'timeupdate'
interface TimeupdateData {
  time: number
}
interface TimeupdateMessage {
  action: TimeupdateAction
  data: TimeupdateData
}

type IdentifyAction = 'identify'
interface IdentifyMessage { 
  action: IdentifyAction
  data: {
    username: string
  }
}

type CreateRoomAction = 'create-room'
interface CreateRoomMessage { 
  action: CreateRoomAction
  data: {
    pathname: string
  }
}

type JoinRoomAction = 'join-room'
interface JoinRoomMessage { 
  action: JoinRoomAction
  data: {
    id: number
  }
}

type MessageAction = 'message'
interface MessageMessage { 
  action: MessageAction
  data: {
    message: string
  }
}


var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/public"))

const _ = {
  is(type, obj) {
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
  },

  only(keys, arr) {
    if (_.is('Object', arr)) {
      arr = Object.values(arr)
    }

    return arr.map(v => {
      let o = {};
      keys.forEach(k => {
        o[k] = v[k]
      })
      return o
    })
  }
}

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

const wss = new Server({ server: server })

class Room {
  id: number
  hostId: number
  pathname: string
  clients: Client[]

  constructor(pathname: string, hostId: number) {
    this.id = roominc++;
    this.pathname = pathname;
    this.hostId = hostId;
    this.clients = [];
  }

  add(client: Client) {
    this.clients.push(client);
  }

  remove(client: Client) {
    const index = this.clients.indexOf(client, 0);
    if (index > -1) {
      this.clients.splice(index, 1);
    }
  }

  send(action: string, data?: any, ignoreClient?: Client) {
    this.clients.forEach(client => {
      if (ignoreClient?.id === client.id) {
        return
      }

      client.send(action, data)
    })
  }
}

class Client {
  id: number
  username: string
  ws: WebSocket
  room: Room

  constructor(ws: WebSocket) {
    this.id = userinc++;
    this.ws = ws;
  }

  send(action: string, data?: any) {
    this.ws.send(JSON.stringify({
      action, data
    }))
  }
}

let clients: {[key:number] : Client } = {}
let rooms: {[key:number] : Room } = {}

let userinc = 1;
let roominc = 1;
let messageinc = 1;

function getRoomList(client: Client) {
  client.send('room-list', {
    roomList: _.only(['id', 'pathname', 'hostId'], rooms)
  })
}

function joinRoom(client, roomId) {
  client.room = rooms[roomId]

  client.send('join-room', {
    roomId,
    hostId: rooms[roomId].hostId,
    userList: _.only(['id', 'username'], rooms[roomId].clients)
  })

  rooms[roomId].clients.forEach(_client => {
    _client.send('user-joined', {
      username: client.username,
      id: client.id
    })
  })

  rooms[roomId].clients.push(client)
}

function sendMessage(client: Client, message: string) {
  const id = messageinc++
  client.room.send('message', { id, fromId: client.id, message })
}

function timeUpdate(client: Client, time: number) {
  client.room.send('timeupdate', { time }, client)
}

function playPause(client: Client, eventName: string) {
  client.room.send(eventName, null, client)
}

wss.on('connection', function connection(ws: WebSocket) {
  const client = new Client(ws)

  clients[client.id] = client;
  client.send('identify', { id: client.id })

  ws.on('close', () => {
    console.log(`client ${client.username}(${client.id}) disconnected`)  
    delete clients[client.id]

    const index = client.room.clients.indexOf(client, 0);
    if (index > -1) {
      client.room.clients.splice(index, 1);
    }

    if (client.room.clients.length === 0) {
      delete rooms[client.room.id]
    }
  })

  ws.on('message', function incoming(message: string) {
    let payload: Message = JSON.parse(message)

    switch (payload.action) {
      case 'identify':
        client.username = payload.data.username
        break;
      case 'create-room': 
        const room = new Room(payload.data.pathname, client.id)
        rooms[room.id] = room
        return joinRoom(client, room.id)
      case 'join-room':
        return joinRoom(client, payload.data.id)
      case 'message':
        return sendMessage(client, payload.data.message)
      case 'get-room-list':
        return getRoomList(client)
      case 'timeupdate':
        return timeUpdate(client, payload.data.time)
      case 'play':
      case 'pause':
        return playPause(client, payload.action)
      default: assertNever(payload);
    }
  });
});


function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}
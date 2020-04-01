import WebSocket from 'ws'

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

const wss = new WebSocket.Server({ server: server })

type Room = {
  id: number,
  hostId: number,
  pathname: string
  clients: Client[]
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

type Message = DatalessMessage | TimeupdateMessage | IdentifyMessage | CreateRoomMessage | JoinRoomMessage | MessageMessage

interface DatalessMessage {
  action: 'get-room-list' | 'play' | 'pause'
}

interface TimeupdateMessage {
  action: 'timeupdate'
  data: {
    time: number
  }
}

interface IdentifyMessage { 
  action: 'identify'
  data: {
    username: string
  }
}
interface CreateRoomMessage { 
  action: 'create-room'
  data: {
    pathname: string
  }
}
interface JoinRoomMessage { 
  action: 'join-room'
  data: {
    id: number
  }
}
interface MessageMessage { 
  action: 'message'
  data: {
    message: string
  }
}


let clients: {[key:number] : Client } = {}
let rooms: {[key:number] : Room } = {}

let userinc = 1;
let roominc = 1;
let messageinc = 1;

function send(clientId, action, data) {
  if (_.is('Object', clientId)) {
    clientId = clientId.id
  }

  clients[clientId].ws.send(JSON.stringify({ action, data }))
}

function getRoomList(userId) {
  send(userId, 'room-list', {
    roomList: _.only(['id', 'pathname', 'hostId'], rooms)
  })
}

function joinRoom(id, roomId) {
  clients[id].room = rooms[roomId]

  send(id, 'join-room', {
    roomId,
    hostId: rooms[roomId].hostId,
    userList: _.only(['id', 'username'], rooms[roomId].clients)
  })

  rooms[roomId].clients.forEach(({ id: clientId }) => {
    send(clientId, 'user-joined', {
      username: clients[id].username,
      id
    })
  })

  rooms[roomId].clients.push(clients[id])
}

function sendMessage(fromId, message) {
  const id = messageinc++
  clients[fromId].room.clients.forEach(client => {
    send(client, 'message', {id, fromId, message})
  }) 
}

function timeUpdate(hostId, time) {
  clients[hostId].room.clients.forEach(client => {
    if (client.id === hostId) return
    client.ws.send(JSON.stringify({
      action: 'timeupdate',
      data: {time}
    }))
  })
}

function playPause(hostId, eventName) {
  clients[hostId].room.clients.forEach(client => {
    if (client.id === hostId) return
    client.send(eventName)
  })
}

wss.on('connection', function connection(ws: WebSocket) {
  const id = userinc++;
  const client = new Client(ws)

  clients[client.id] = client;
  client.send('identify', { id })

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
        let u = clients[id].username = payload.data.username
        break;
      case 'create-room': 
        const roomId = roominc++
        rooms[roomId] = {
          id: roomId,
          pathname: payload.data.pathname,
          hostId: id,
          clients: [],
        }

        return joinRoom(id, roomId)
      case 'join-room':
        return joinRoom(id, payload.data.id)
      case 'message':
        return sendMessage(id, payload.data.message)
      case 'get-room-list':
        return getRoomList(id)
      case 'timeupdate':
        return timeUpdate(id, payload.data.time)
      case 'play':
      case 'pause':
        return playPause(id, payload.action)
      default: assertNever(payload);
    }
  });
});


function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}
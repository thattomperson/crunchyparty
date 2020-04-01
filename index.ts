var WebSocketServer = require("ws").Server
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

var wss = new WebSocketServer({server: server})

let clients = {}
let rooms = {}

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
  let u = clients.get(hostId)
  let room = rooms.get(u.room)

  room.clients.forEach(cid => {
    if (cid === hostId) return
    let c = clients.get(cid)
    c.ws.send(JSON.stringify({
      action: 'timeupdate',
      data: {time}
    }))
  })
}

function playPause(hostId, eventName) {
  let u = clients.get(hostId)
  let room = rooms.get(u.room)

  room.clients.forEach(cid => {
    if (cid === hostId) return
    let c = clients.get(cid)
    c.ws.send(JSON.stringify({
      action: eventName,
    }))
  })
}

wss.on('connection', function connection(ws) {
  const userId = userinc++;
  clients.set(userId, {
    room: null,
    username: null,
    ws
  })

  ws.send(JSON.stringify({
    action: 'identify',
    data: { userId }
  }))

  ws.onclose = () => {
    let u = clients.get(userId)
    if (u.room) {
      let r = rooms.get(u.room)
      r.clients.delete(userId)
      if (r.clients.length == 0) {
        rooms.delete(u.room)
      }
    }
    clients.delete(userId)
  }

  ws.on('message', function incoming(message) {
    let payload = JSON.parse(message)

    console.log(payload)

    switch (payload.action) {
      case 'identify':
        let u = clients.get(userId)
        u.username = payload.data.username
        clients.set(userId, u)
        break;
      case 'create-room': 
        const roomId = roominc++
        rooms.set(roomId, {
          roomId,
          pathname: payload.action.pathname,
          hostId: userId,
          clients: new Set([]),
        })

        joinRoom(userId, roomId)
        break;
      case 'join-room':
        joinRoom(userId, payload.data.roomId)
        break
      case 'message':
        sendMessage(userId, payload.data.message)
        break;
      case 'get-room-list':
        getRoomList(userId)
        break;
      case 'timeupdate':
        timeUpdate(userId, payload.data.time)
        break
      case 'play':
      case 'pause':
        playPause(userId, payload.action)
        break

    }
  });
});
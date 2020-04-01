const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let clients = new Map()
let rooms = new Map()

let userinc = 1;
let roominc = 1;
let messageinc = 1;

function getRoomList(userId) {
  let roomList = []
  rooms.forEach(k => roomList.push(k))

  let c = clients.get(userId)
  c.ws.send(JSON.stringify({
    action: 'room-list',
    data: {roomList},
  }))
}

function joinRoom(userId, roomId) {
  console.log(`user ${userId} joining room ${roomId}`)
  let c = clients.get(userId)
  c.room = roomId
  clients.set(userId, c)

  let r = rooms.get(roomId)
  let userList = [];

  r.clients.forEach(clientId => {
    userList.push({
      username: clients.get(clientId).username,
      userId: clientId,
    })
  })

  c.ws.send(JSON.stringify({
    action: 'join-room',
    data: {
      roomId,
      hostId: r.hostId,
      userList
    }
  }))

  r.clients.forEach(clientId => {
    let u = clients.get(clientId)
    u.ws.send(JSON.stringify({
      action: 'user-joined',
      data: {
        username: c.username,
        userId,
      }
    }))
  })

  r.clients.add(userId)
  rooms.set(roomId, r)
}

function sendMessage(fromUserId, message) {
  console.log(`new message from ${fromUserId}`)
  const messageId = messageinc++
  const c = clients.get(fromUserId)
  console.log(`sending to room ${c.room}`)
  const r = rooms.get(c.room)
  
  r.clients.forEach(cid => {
    console.log(`forwarding message to user ${cid}`)
    clients.get(cid).ws.send(JSON.stringify({
      action: 'message',
      data: {
        messageId: messageId,
        fromId: fromUserId,
        message 
      }
    }))
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
import http from "http";
import https from "https";

import {
  WebSocket,
  Server,
  ActionNames,
  ActionArgs,
  SendMap,
} from "@ws/server";

const _ = {
  is(type: any, obj: any) {
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
  },

  only(keys: string[], arr: any) {
    if (_.is("Object", arr)) {
      arr = Object.values(arr);
    }

    return arr.map((v: any) => {
      let o: { [key: string]: any } = {};
      keys.forEach((k) => {
        o[k] = v[k];
      });
      return o;
    });
  },
};

const getUniqueID = (): string => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + "-" + s4();
};
interface PlaybackStatus {
  paused: boolean
  time: number
};

export default function (server: http.Server | https.Server) {
  const wss = new Server(server);

  let clients: { [key: string]: Client } = {};
  let rooms: { [key: string]: Room } = {};

  class Room {
    id: string;
    host: Client;
    pathname: string;
    playback: PlaybackStatus;

    clients: Client[];

    constructor(pathname: string, host: Client) {
      this.id = getUniqueID();
      this.pathname = pathname;
      this.host = host;
      this.clients = [];

      this.playback = {
        paused: false,
        time: 0,
      }

      rooms[this.id] = this;

      this.host.ws.on('Timeupdate', ({ time }) => {
        this.playback.time = time;
        this.sendToMembers('Timeupdate', { time })
      })

      this.host.ws.on('Play', () => {
        this.playback.paused = false;
        this.sendToMembers('Play')
      })

      this.host.ws.on('Pause', () => {
        this.playback.paused = true;
        this.sendToMembers('Pause')
      })
    }

    add(client: Client) {
      this.clients.push(client);

      client.send("JoinRoom", {
        roomID: this.id,
        hostID: this.host.id,
      });

      this.sendToOthers(client, "UserJoined", {
        username: client.username ?? "unknown",
        userID: client.id,
      });
    }

    remove(client: Client) {
      const index = this.clients.indexOf(client, 0);
      if (index > -1) {
        this.clients.splice(index, 1);
      }

      if (this.clients.length === 0) {
        delete rooms[this.id];
      }
    }

    sendToMembers<T extends ActionNames<SendMap>>(
      action: T,
      ...args: ActionArgs<SendMap, T>
    ) {
      this.sendToOthers(this.host, action, ...args)
    }

    sendToOthers<T extends ActionNames<SendMap>>(
      ignore: Client,
      action: T,
      ...args: ActionArgs<SendMap, T>
    ) {
      this.clients.forEach((client) => {
        if (ignore.id === client.id) return;
        client.send(action, ...args);
      });
    }

    send<T extends ActionNames<SendMap>>(
      action: T,
      ...args: ActionArgs<SendMap, T>
    ) {
      this.clients.forEach((client) => {
        client.send(action, ...args);
      });
    }
  }

  class Client {
    id: string;
    username?: string;
    ws: WebSocket;
    room?: Room;

    constructor(ws: WebSocket) {
      this.id = getUniqueID();
      this.ws = ws;

      clients[this.id] = this;
    }

    send<T extends ActionNames<SendMap>>(
      action: T,
      ...args: ActionArgs<SendMap, T>
    ) {
      this.ws.send(action, ...args);
    }
  }

  wss.on("connection", function connection(ws: WebSocket) {
    const client = new Client(ws);

    clients[client.id] = client;
    client.send("IdentifyUserID", { ID: client.id });

    ws.on("close", () => {
      console.log(`client ${client.username}(${client.id}) disconnected`);
      delete clients[client.id];
      client.room?.remove(client);
    });

    ws.on("IdentifyUsername", ({ username }) => {
      client.username = username;
    });

    ws.on("CreateRoom", ({ pathname }) => {
      const room = new Room(pathname, client);
      room.add(client);
    });

    ws.on("JoinRoom", ({ roomID }) => {
      rooms[roomID].add(client);
    });

    ws.on("Message", ({ message }) => {
      client.room?.send("Message", {
        ID: getUniqueID(),
        userID: client.id,
        username: client.username ?? "guest",
        message: message,
      });
    });

    ws.on("GetRoomList", () => {
      client.send("RoomList", {
        roomList: _.only(["id", "pathname", "hostId"], rooms),
      });
    });
  });
}

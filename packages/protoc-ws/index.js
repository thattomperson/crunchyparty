const { parse } = require('./parser');
const slugify = require('slugify')
const fs = require('fs');

var data = parse(fs.readFileSync('api').toString());

let serverRxNames = []
let clientRxNames = []

function typename(field) {
    let t
    switch (field.typename) {
        case 'int64':
        case 'int32':
        case 'int':
        case 'uint64':
        case 'uint32':
        case 'uint':
            t = 'number'
            break
        default:
            t = field.typename
    }

    if (field.repeated) {
        t += '[]'
    }
    return t
}

data.content.forEach(message => {
    if (message.opts.from == 'client' || message.opts.from == 'both') {
        serverRxNames.push({
            name: message.name,
            fields: message.content.map(field => {
                return {
                    name: field.name,
                    type: typename(field)
                }
            })
        })
    }
    if (!message.opts.from || message.opts.from == 'server' || message.opts.from == 'both') {
        clientRxNames.push({
            name: message.name,
            fields: message.content.map(field => {
                return {
                    name: field.name,
                    type: typename(field)
                }
            })
        })
    }
})


const client = `
import EventEmitter from 'eventemitter3'

export interface Options {
    heartbeat?: number;
}


export type EventMap = {
    ${clientRxNames.map(({name, fields}) => `'${name}': [${fields.length ? `{${fields.map(({name, type}) => `${name}: ${type}`).join()}}` : '' }]`).join('\n\t')}
    'error': [Event]
    'open': [Event]
    'close': [Event]
}

export type SendMap = {
    ${serverRxNames.map(({name, fields}) => `'${name}': [${fields.length ? `{${fields.map(({name, type}) => `${name}: ${type}`).join()}}` : '' }]`).join('\n\t')}
}

export type ActionNames<T extends { [key: string]: any[] }> = keyof T;
export type ActionArgs<T extends { [key: string]: any[] }, K extends ActionNames<T>> = K extends keyof T ? T[K] : never;

export class Socket extends EventEmitter<EventMap> {
    private url: string;
    private ws?: WebSocket
    private queue: any[]
    private options: Options

    constructor(url: string, options?: Options) {
        super()
        this.url = url;
        this.queue = [];

        this.options = {
            heartbeat: 1 * 60 * 1000 // 1 minute
        }
        Object.assign(this.options, options);

        this.connect()
    }

    private connect() {
        this.ws = new WebSocket(this.url)
        this.ws.addEventListener('message', this.handleMessage.bind(this))
        this.ws.addEventListener('open', this.handleOpen.bind(this))
        this.ws.addEventListener('error', this.handleError.bind(this))
        this.ws.addEventListener('close', this.handleClose.bind(this))
    }

    public send<T extends ActionNames<SendMap>>(action: T, ...args: ActionArgs<SendMap, T>): void {
        const payload = { action, args }
        if (!this.ws || this.ws.readyState != this.ws.OPEN) {
            this.queue.push(payload)
            return;
        }

        console.log('->', action, args)

        this.ws?.send(JSON.stringify(payload))
    }

    private handleOpen(event: Event): void {
        this.emit('open', event)

        let payload
        while (payload = this.queue.shift()) {
            this.ws?.send(JSON.stringify(payload))
        }
    }

    private handleMessage(event: MessageEvent): void {
        if (!event.data) {
            return this.ws?.send('')
        }

        const { action, data } = JSON.parse(event.data)
        console.log('<-', action, data)
        this.emit(action, data)
    }

    private handleError(event: Event): void {
        this.emit('error', event)
        console.error('socket error,', event)
    }

    private handleClose(event: Event): void {
        this.emit('close', event)
        console.log('Socket closed, reconnecting...')
        this.connect();
    }
}
`

const server = `
import _WebSocket, { Server as _Server } from 'ws'
import EventEmitter from 'eventemitter3'
import { ClientRequest, IncomingMessage, Server as HttpServer } from 'http'

type ServerEventMap = {
    'connection': [WebSocket, IncomingMessage]
    'error': [Error]
    'headers': [string[], IncomingMessage]
    'close': []
    'listening': []
}

export type EventMap = {
    'connection': [WebSocket]
    'error': [Error]
    'open': []
    'close': [number, string]
    'ping' : [Buffer]
    'pong': [Buffer] 
    'unexpected-response': [ClientRequest, IncomingMessage]
    'upgrade': [IncomingMessage]
    ${serverRxNames.map(({name, fields}) => `'${name}': [${fields.length ? `{${fields.map(({name, type}) => `${name}: ${type}`).join()}}` : '' }]`).join('\n\t')}
}

export type SendMap = {
    ${clientRxNames.map(({name, fields}) => `'${name}': [${fields.length ? `{${fields.map(({name, type}) => `${name}: ${type}`).join()}}` : '' }]`).join('\n\t')}
}

export type ActionNames<T extends { [key: string]: any[] }> = keyof T;
export type ActionArgs<T extends { [key: string]: any[] }, K extends ActionNames<T>> = K extends keyof T ? T[K] : never;

export class WebSocket extends EventEmitter<EventMap> {
    private ws: _WebSocket;
    constructor(ws: _WebSocket) {
        super()

        this.ws = ws;

        this.ws.on('open', (...args) => this.emit('open', ...args))
        this.ws.on('error', (...args) => this.emit('error', ...args))
        this.ws.on('close', (...args) => this.emit('close', ...args))
        this.ws.on('message', this.handleMessage.bind(this))
        this.ws.on('ping', (...args) => this.emit('ping', ...args))
        this.ws.on('pong', (...args) => this.emit('pong', ...args))
        this.ws.on('unexpected-response', (...args) => this.emit('unexpected-response', ...args))
        this.ws.on('upgrade', (...args) => this.emit('upgrade', ...args))
    }

    public send<T extends ActionNames<SendMap>>(this: WebSocket, action: T, ...args: ActionArgs<SendMap, T>): void {
        this.ws.send({ action, ...args })
    }

    public ping(): void {
        this.ws.send('');
    }

    private handleMessage(event: MessageEvent) {
        const { action, data } = JSON.parse(event.data)
        this.emit(action, data);
    }
}

export class Server extends EventEmitter<ServerEventMap> {
    private wss: _Server;
    private clients: WebSocket[]
    

    constructor(server: HttpServer) {
        super()
        this.wss = new _Server({ server })
        this.clients = [];

        this.wss.on('connection', this.handleConnection)
        this.wss.on('close', (...args) => this.emit('close', ...args))
        this.wss.on('error', (...args) => this.emit('error', ...args))

        let interval: NodeJS.Timeout | undefined;

        this.wss.on('open', () => {
            interval = setInterval(() => {
                this.clients.forEach(c => c.ping())
            }, 1 * 60 * 1000) // 1 minute
        })

        this.wss.on('close', () => {
            if (interval) clearInterval(interval)
        })
    }

    private handleConnection(socket: _WebSocket, request: IncomingMessage) {
        let client = new WebSocket(socket);
        this.clients.push(client);
        this.emit('connection', client, request);
    }
}
`

fs.mkdirSync('./src/node_modules/@ws/client', {recursive: true})
fs.writeFileSync('./src/node_modules/@ws/client/index.ts', client)
fs.mkdirSync('./src/node_modules/@ws/server', {recursive: true})
fs.writeFileSync('./src/node_modules/@ws/server/index.ts', server)
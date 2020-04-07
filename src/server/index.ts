import Sentry from '@sentry/node'
import http from 'http'
import express from 'express';
import socket from './socket'


var app = express()
var port = process.env.PORT || 5000

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SOURCE_VERSION,
});

app.use(Sentry.Handlers.requestHandler());
app.use(express.static(__dirname + "/public"))
app.use(Sentry.Handlers.errorHandler());

var server = http.createServer(app)
socket(server)

server.listen(port)
console.log("http server listening on %d", port)


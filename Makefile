all: src/node_modules/@ws

packages/protoc-ws/parser.js: packages/protoc-ws/proto.peg
	node packages/protoc-ws/build.js

src/node_modules/@ws: packages/protoc-ws/parser.js api
	rm -rf src/node_modules/@ws || true
	node packages/protoc-ws/index.js
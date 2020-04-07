<main class="flex" style="--sidebar-width: {sidebarWidth}px">
    {#if roomId}
    <div>
        <TopAppBar variant="static" dense>
            <Row>
            <Section>
                <Title>CrunchyParty - Room: { roomId }</Title>
            </Section>
            <Section align="end" toolbar>
                {#if fullscreen}
                    <IconButton 
                        class="material-icons"
                        aria-label="Exit fullscreen"
                        on:click={() => fullscreen = false}
                    >fullscreen_exit</IconButton>
                {:else}
                    <IconButton
                        class="material-icons"
                        aria-label="Fullscreen"
                        on:click={() => fullscreen = true}
                    >fullscreen</IconButton>
                {/if}
            </Section>
            </Row>
        </TopAppBar>
    </div>
    <div class="stack padded messages">
        {#each messages as message (message.messageId)}
            {#if message.system} 
                <div class="system-message">{message.system}</div>
            {:else}
            <div class="message-cont {message.userId === userId ? 'self' : ''}">
                <div class="message">
                    <div class="user-info">
                        <img alt="{message.username}" src="data:image/png;base64,{identicon(message.username)}" />
                        <span class="username">{message.username}</span>
                    </div>
                    <span class="message-text">{message.message}</span>
                </div>
            </div>
            {/if}
        {/each}
    </div>
    <div class="padded">
        <form on:submit={sendMessage}>
            <Textfield dense variant="outlined" bind:value={message}/>
        </form>
    </div>

    {:else if joiningRoom}
    <div class="stack padded">
        {#each roomList as room}
            <Button variant="raised" on:click={() => joinRoom(room.roomId)}>
                <Label>{ room.roomId }</Label>
            </Button>
        {/each}
    </div>
    {:else}
    <div class="flex padded stack grow">
        <Button
            disabled={!connected}
            on:click={showJoinList}
            variant="raised"
        >
            <Label>Join Room</Label>
        </Button>
        <Button
            disabled={!connected}
            variant="outlined"
            on:click={createRoom}
        >
            <Label>Create Room</Label>
        </Button>
    </div>
    {/if}
</main>

<style>
.message {
    float: left;
    max-width: 250px;
    background: #282828;
    color: white;
    border-radius: 20px;
    padding: 2px;
    display: flex;
    justify-content: space-between
}
.message .user-info {
    position: relative;
    top: -5px;
    left: -5px;
}
.message .user-info .username {
    font-size: 10px;
    position: absolute;
    top: 1px;
    padding-left: 2px;
}
.message .user-info img {
    border-radius: 100%;
}
.message .message-text {
    padding: 7px 10px 5px 0;
}
.message-cont {
    --space: .5rem;
}
.system-message {
    --space: .25rem;
    text-align: center;
    color: white;
}
.messages {
    flex-grow: 1;
}
.padded {
    padding: 1rem;
}

.self .message {
    float: right; 
}

.flex {
    display: flex;
    justify-items: center;
    justify-content: space-around;
    flex-direction: column;
}

.stack {
  --space: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.stack > :global(*) {
  margin-top: 0;
  margin-bottom: 0;
} 

.stack > :global(* + *) {
  margin-top: var(--space);
}

main {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    width: var(--sidebar-width);
    background: #4b4b4b;
    box-sizing: border-box;
    z-index: 200;
}
</style>

<script>
import Textfield from '@smui/textfield'
import TopAppBar, {Row, Section, Title} from '@smui/top-app-bar'
import IconButton from '@smui/icon-button';
import Button, {Label} from '@smui/button'
import Identicon from 'identicon.js'
import md5 from 'crypto-js/md5'
import { Socket } from '@ws/client'

let connected = false
let roomId = null;
let userId = null;
let fullscreen = false;
let joiningRoom = false;
let host = false;

let sidebarWidth = 300;

let systeminc = 0;

let username = 'unknown';
if (document && document.querySelector && document.querySelector('.username a')) {
    username = document.querySelector('.username a').text.trim()
}

let roomList = [];

let message = ''



setInterval(() => {
    // server keep alive ping
    fetch(process.env.API_SERVER_URL)
}, 20 * 60 * 1000)


const background = document.getElementById('showmedia_video_box_wide');
const video_wrapper = document.getElementById('showmedia_video_player');
const video_frame = document.getElementById('vilos-player');

$: background.style.position = fullscreen ? 'fixed' : '';
$: background.style.top = fullscreen ? '0' : '';
$: background.style.right = fullscreen ? '300px' : '';
$: background.style.left = fullscreen ? '0' : '';
$: background.style.bottom = fullscreen ? '0' : '';
$: background.style.background = fullscreen ? 'black' : '';
$: background.style.width = fullscreen ? 'auto' : '';
$: background.style.height = fullscreen ? 'auto' : '';
$: background.style.display = fullscreen ? 'flex' : '';
$: background.style.zIndex = fullscreen ? '2000' : '';
$: background.style.justifyContent = fullscreen ? 'center' : '';
$: background.style.flexDirection = fullscreen ? 'column' : '';

$: video_wrapper.style.position =  fullscreen ? 'relative' : '';
$: video_wrapper.style.zIndex =  fullscreen ? '200' : '';
$: video_wrapper.style.paddingBottom =  fullscreen ? '56.25%' : '';
$: video_wrapper.style.height =  fullscreen ? 'auto' : '';

$: video_frame.style.position = fullscreen ? 'absolute' : '';
$: video_frame.style.top = fullscreen ? '0' : '';
$: video_frame.style.left = fullscreen ? '0' : '';
$: video_frame.style.width = fullscreen ? '100%' : '';
$: video_frame.style.height = fullscreen ? '100%' : '';

$: document.body.style.marginRight = `${sidebarWidth}px`

const ws = new Socket(process.env.SOCKET_SERVER_URL)

let messages = []

const sysmsg = (msg) => {
    messages = [...messages, {
        messageId: `system-${systeminc++}`,
        system: msg
    }];
}

function createRoom() {
    ws.send('CreateRoom', {
        pathname: location.pathname
    })
}

function joinRoom(roomId) {
    ws.send('JoinRoom', { roomId })
}

function showJoinList() {
    joiningRoom = true
    ws.send('GetRoomList')
}


function sendMessage(event) {
    event.preventDefault()
    ws.send('Message', { message })
    message = ""
}

const identicon = (() => {
    let d = {};
    return (...args) => {
        let k = JSON.stringify(args)
        return d[k] ? d[k] : d[k] = (new Identicon(md5(username).toString(), 26)).toString();
    }
})();

ws.on('open', () =>{
    connected = true
    ws.send('IdentifyUsername', { username })
    sysmsg(`connected`)
})
ws.on('close', () => {
    connected = false
    sysmsg(`disconnected`)
})

let lasttime = 0;
let timeupdate = 0;
VILOS_PLAYERJS.on('timeupdate', (event) => {
    if (host && (Math.abs(event.seconds - lasttime) > 1 || (timeupdate++ == 10))) {
        timeupdate = 0;
        ws.send('Timeupdate', {time: event.seconds})
    }
    lasttime = event.seconds;
});

VILOS_PLAYERJS.on('play', () => host && ws.send('Play'))
VILOS_PLAYERJS.on('pause', () => host && ws.send('Pause'))

ws.on('IdentifyUserID', data => userId = data.userId)
ws.on('JoinRoom', data => {
    joiningRoom = false
    roomId = data.roomId
    host = userId == data.hostId
})
ws.on('UserJoined', data => sysmsg(`${data.username} joined`))
ws.on('Message', data => {
    messages = [...messages, data];
})
ws.on('Timeupdate', ({ time }) => {
    VILOS_PLAYERJS.getCurrentTime(t => {
        if (Math.abs(t - time) > 5) {
            VILOS_PLAYERJS.setCurrentTime(data.time)
            sysmsg('Jumped to hosts time')
        }
    })
})

ws.on('Play', () => {
    VILOS_PLAYERJS.play()
    sysmsg('Host played')
})
ws.on('Pause', () => {
    VILOS_PLAYERJS.pause()
    sysmsg('Host paused')
})

ws.on('RoomList', data => {
    roomList = data.roomList
})
</script>
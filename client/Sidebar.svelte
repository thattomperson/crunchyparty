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
            <div class="message-cont {message.fromId === userId ? 'self' : ''}">
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


// $: video_player.style.right =  fullscreen ? `${sidebarWidth}px` : '';
// $: video_player.style.width =  fullscreen ? 'auto' : '';
// $: video_player.style.height =  fullscreen ? 'auto' : '';
// $: video_player.style.top =  fullscreen ? '0' : '';
// $: video_player.style.bottom =  fullscreen ? '0' : '';
// $: video_player.style.background =  fullscreen ? 'black' : '';

$: document.body.style.marginRight = `${sidebarWidth}px`

// var requestFullScreen = document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.msRequestFullscreen;
// var cancelFullScreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;

// $: fullscreen ? requestFullScreen.call(document.body) : cancelFullScreen.call(document)

const ws = new WebSocket(process.env.SOCKET_SERVER_URL)
let messages = []

function createRoom() {
    ws.send(JSON.stringify({
        action: 'create-room',
        data: {
            pathname: location.pathname
        }
    }))
}

function joinRoom(roomId) {
    ws.send(JSON.stringify({
        action: 'join-room',
        data: { roomId }
    }))
}

function showJoinList() {
    joiningRoom = true
    ws.send(JSON.stringify({
        action: 'get-room-list'
    }))
}


function sendMessage(event) {
    event.preventDefault()

    ws.send(JSON.stringify({
        action: 'message',
        data: {
            message
        }
    }))

    message = ""
}

const identicon = (() => {
    let d = {};
    return (...args) => {
        let k = JSON.stringify(args)
        return k[d] ? k[d] : k[d] = (new Identicon(md5(username).toString(), 26)).toString();
    }
})();

    

ws.onopen = () => {
    connected = true

    ws.send(JSON.stringify({
        action: 'identify',
        data: { username }
    }))
    
    let lasttime = 0;
    let timeupdate = 0;
    VILOS_PLAYERJS.on('timeupdate', (event) => {
        if (host && (Math.abs(event.seconds - lasttime) > 1 || (timeupdate++ == 10))) {
            timeupdate = 0;
            ws.send(JSON.stringify({
                action: 'timeupdate',
                data: {time: event.seconds},
            }))
        }
        lasttime = event.seconds;
    });

    VILOS_PLAYERJS.on('play', () => host && ws.send(JSON.stringify({action: 'play'})))
    VILOS_PLAYERJS.on('pause', () => host && ws.send(JSON.stringify({action: 'pause'})))
    
    ws.onmessage = (message) => {
        const payload = JSON.parse(message.data)

        console.log(payload)

        switch (payload.action) {
            case 'identify':
                userId = payload.data.userId
                break;
            case 'join-room':
                joiningRoom = false
                roomId = payload.data.roomId
                host = userId == payload.data.hostId
                break;
            case 'user-joined':
                messages = [...messages, {
                    messageId: `system-${systeminc++}`,
                    system: `${payload.data.username} joined`
                }];
                break;
            case 'message':
                messages = [...messages, payload.data];
                break;
            case 'timeupdate':
                VILOS_PLAYERJS.getCurrentTime(t => {
                    if (Math.abs(t - payload.data.time) > 5) {
                        VILOS_PLAYERJS.setCurrentTime(payload.data.time)
                        messages = [...messages, {
                            system: `Jumped to hosts time`
                        }];
                    }
                })
                break
            case 'play':
            case 'pause':
                VILOS_PLAYERJS[payload.action]()
                messages = [...messages, {
                    messageId: `system-${systeminc++}`,
                    system: `Host ${payload.action === 'play' ? 'played' : 'paused'}`
                }];
                break
            case 'room-list':
                roomList = payload.data.roomList
                break
        }

    }
}
</script>
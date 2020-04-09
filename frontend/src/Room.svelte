<Stack style="--space: .25rem; height: 100%">
    <header>
        <h1>StreamParty</h1>
    </header>
    <div class="messages" use:scroll={messageGroups}>
        <Stack style="--space: .5rem">
            {#each messageGroups as g}
            <div class="message-group {g.user == username ? 'me' : ''}">
                <div class="info">
                    <img src="https://i.pravatar.cc/50?u={g.user}">
                </div>
                <Stack style="--space: .125rem">
                    {#if g.user != username}
                    <h6>{g.user}</h6>
                    {/if}
                    {#each g.messages as message}
                        <div class="message">{message}</div>
                    {/each}
                </Stack>
            </div>
            {/each}
        </Stack>
    </div>
    <form on:submit={send} class="chatbox">
        <input bind:value={message} placeholder="message">
    </form>
</Stack>


<script>
import { tick } from 'svelte';
import Stack from './Stack.svelte'

let messageGroups = [
    {
        user: 'test',
        messages: [
            'Lorem ipsum dolor sit amet, conse ctetur adipis cing elit.',
            'Lorem ipsum',
            'Lorem ipsum dolor sit amet, conse ctetur adip iscing elit.',
            'Lorem ipsum dolor sit amet, consec tetur adipis cing elit.',
        ]
    }, 
    {
        user: 'me',
        messages: [
            'Lorem ipsum dolor sit amet, conse ctetur adipisc ing elit.',
            'dolor sit amt.',
            'Lorem ipsum dolor sit amet, cons ectetur adip scing elit.',
        ]
    }
]
let message = ""
let username = "me"

function send(e) {
    if (e.preventDefault) e.preventDefault()

    if (messageGroups[messageGroups.length - 1].user == username) {
        messageGroups[messageGroups.length - 1].messages = [...messageGroups[messageGroups.length - 1].messages, message]
    } else {
        messageGroups = [...messageGroups, {
            user: username,
            messages: [message]
        }]
    }

    message = ""
}

function scroll(node) {
    return {
        async update() {
            await tick() // wait until after a the browser recalculates the scrollbar
            node.scrollTop = 100000000000 // really big magic number 
        }
    }
}

</script>

<style>
    .messages {
        flex-grow: 1;
        padding: .25rem;
        overflow-y: scroll;
    }

    .chatbox {
        justify-self: flex-end;
        display: flex;
        flex-direction: column
    }
    .chatbox input {
        background: black;
        color: white;
        border: none;
        border-top: #222 solid 1px;
        padding: 1rem;
    }

    .message-group .message {
        background: #222;
        width: -moz-fit-content;
        width: fit-content;
        max-width: 80%;
        padding: .5rem;
        border-radius: .25rem 1rem 1rem .25rem;
    }

    .message:last-child {
        border-bottom-left-radius: 1rem;
    }
    .message:first-of-type {
        border-top-left-radius: 1rem;
    }
    .message-group.me .message {
        background: #00D7FF;
        border-radius: 1rem .25rem .25rem 1rem;
        align-self: flex-end;
    }

    .message-group {
        display: flex;
    }
    .message-group.me {
        flex-direction: row-reverse;
    }

    .message-group .info {
        width: 4rem;
        margin-right: .25rem;
        display: flex;
        flex-direction: column;
        justify-content: flex-end
    }

    .message-group.me .info {
        margin-right: 0;
        margin-left: .25rem;
    }

    .message-group .info img {
        width: 3rem;
        border-radius: 100%;
    }

    .me .message:first-child {
        border-top-right-radius: 1rem;
    }
    .me .message:last-child {
        border-bottom-right-radius: 1rem;
    }
</style>
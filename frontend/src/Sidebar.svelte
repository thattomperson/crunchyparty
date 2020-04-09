<div class="sidebar">
    <Room />
</div>


<script>
    import Lobby from './Lobby.svelte'
    import Room from './Room.svelte'
</script>

<style>
    .sidebar :global(*) {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
    }

    .sidebar {
        --width: 350px;

        width: var(--width);
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;

        background: black;
        color: white;
    }
</style>
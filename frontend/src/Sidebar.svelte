<div class="sidebar">
    <Lobby />
</div>


<script>
    import Lobby from './Lobby.svelte'
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
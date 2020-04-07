interface Player {
    on(event: 'play', listener: (() => void)): void;
    on(event: 'pause', listener: (() => void)): void;
    play(): void;
    pause(): void;
}

declare var VILOS_PLAYER: Player
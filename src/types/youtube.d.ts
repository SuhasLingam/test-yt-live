declare namespace YT {
  interface Player {
    getCurrentTime(): number;
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
  }
}

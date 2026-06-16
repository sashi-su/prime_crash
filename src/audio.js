const SOUND_PATHS = {
  beam: "sound/beam.mp3",
  beamgun: "sound/beamgun.mp3",
  bgm1: "sound/bgm1.mp3",
  bgm2: "sound/bgm2.mp3",
  bigExplosion: "sound/big_explosion.mp3",
  cancel: "sound/cancel.mp3",
  confirm: "sound/confirm.mp3",
  correct: "sound/correct.mp3",
  count: "sound/count.mp3",
  delete: "sound/delete.mp3",
  explosion: "sound/explosion.mp3",
  impossible: "sound/impossible.mp3",
  result: "sound/result.mp3",
  select: "sound/select.mp3",
  shot: "sound/shot.mp3",
};

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.music = null;
    this.currentMusicName = "";
    this.unlocked = false;

    for (const [name, path] of Object.entries(SOUND_PATHS)) {
      const audio = new Audio(path);
      audio.preload = "auto";
      this.sounds.set(name, audio);
    }
  }

  unlock() {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    for (const audio of this.sounds.values()) {
      audio.load();
    }
  }

  playSfx(name) {
    if (!this.unlocked) {
      return;
    }
    const source = this.sounds.get(name);
    if (!source) {
      return;
    }
    const sound = source.cloneNode();
    sound.volume = 0.9;
    sound.play().catch(() => {});
  }

  playMusic(name) {
    if (!this.unlocked || this.currentMusicName === name) {
      return;
    }
    this.stopMusic();
    const source = this.sounds.get(name);
    if (!source) {
      return;
    }
    this.music = source.cloneNode();
    this.music.loop = true;
    this.music.volume = 0.55;
    this.currentMusicName = name;
    this.music.play().catch(() => {});
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    this.music = null;
    this.currentMusicName = "";
  }
}

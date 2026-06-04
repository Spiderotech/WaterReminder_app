import Sound from 'react-native-sound';

type BackgroundMusicTrack = 'digitalMe' | 'leaderboard';

const tracks: Record<BackgroundMusicTrack, string> = {
  digitalMe: 'digital_me_bg.mp3',
  leaderboard: 'leaderboard_bg.mp3',
};

let activeSound: Sound | null = null;
let activeTrack: BackgroundMusicTrack | null = null;

Sound.setCategory('Ambient', true);

export const playBackgroundMusic = (track: BackgroundMusicTrack) => {
  if (activeTrack === track && activeSound?.isLoaded()) {
    activeSound.play();
    return;
  }

  stopBackgroundMusic();
  activeTrack = track;

  const sound = new Sound(tracks[track], Sound.MAIN_BUNDLE, error => {
    if (error) {
      if (activeSound === sound) {
        activeSound = null;
        activeTrack = null;
      }
      return;
    }

    sound.setNumberOfLoops(-1);
    sound.setVolume(0.22);
    sound.play();
  });

  activeSound = sound;
};

export const stopBackgroundMusic = () => {
  const sound = activeSound;
  activeSound = null;
  activeTrack = null;

  if (!sound) return;

  sound.stop(() => {
    sound.release();
  });
};

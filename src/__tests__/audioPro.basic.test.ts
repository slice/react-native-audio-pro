import { AudioPro } from '../audioPro';
import { NativeModules } from 'react-native';

describe('AudioPro basic functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls native play method with correct parameters', () => {
    const track = {
      id: 'test-track',
      url: 'https://example.com/audio.mp3',
      title: 'Test Track',
      artwork: 'https://example.com/artwork.jpg',
    };

    AudioPro.play(track);

    expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/audio.mp3',
        title: 'Test Track',
      }),
      expect.any(Object)
    );
  });

  it('calls native pause method', () => {
    AudioPro.pause();
    expect(NativeModules.AudioPro.pause).toHaveBeenCalled();
  });

  it('calls native resume method', () => {
    AudioPro.resume();
    expect(NativeModules.AudioPro.resume).toHaveBeenCalled();
  });

  it('calls native stop method', () => {
    AudioPro.stop();
    expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
  });
});

describe('AudioPro ambient functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls native ambientPlay method with correct parameters', () => {
    const options = {
      url: 'https://example.com/ambient.mp3',
      loop: true,
    };

    AudioPro.ambientPlay(options);

    expect(NativeModules.AudioPro.ambientPlay).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/ambient.mp3',
        loop: true,
      })
    );
  });

  it('calls native ambientStop method', () => {
    AudioPro.ambientStop();
    expect(NativeModules.AudioPro.ambientStop).toHaveBeenCalled();
  });

  it('calls native ambientPause method', () => {
    AudioPro.ambientPause();
    expect(NativeModules.AudioPro.ambientPause).toHaveBeenCalled();
  });

  it('calls native ambientResume method', () => {
    AudioPro.ambientResume();
    expect(NativeModules.AudioPro.ambientResume).toHaveBeenCalled();
  });
}); 
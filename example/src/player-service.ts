import {
	AudioProEventName,
	type AudioProEventPayload,
} from 'react-native-audio-pro';
import { AudioPro } from '../../src/audioPro';

export function setupAudioPro() {
	AudioPro.configure({ contentType: 'music', debug: __DEV__ });
	AudioPro.addEventListener((event: AudioProEventPayload) => {
		switch (event.name) {
			case AudioProEventName.SEEK_COMPLETE:
				// {name, position, duration}
				console.log(event);
				break;
			case AudioProEventName.PROGRESS:
				// {name, position, duration}
				console.log(event);
				break;
			case AudioProEventName.TRACK_ENDED:
				// {name, position, duration}
				console.log(event);
				break;
			case AudioProEventName.REMOTE_NEXT:
				console.log(event);
				break;
			case AudioProEventName.REMOTE_PREV:
				console.log(event);
				break;
			case AudioProEventName.PLAYBACK_ERROR:
				// {name}
				console.warn(event.name);
				break;
			default:
				break;
		}
	});
}

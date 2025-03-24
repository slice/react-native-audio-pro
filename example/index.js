import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { registerAudioProListeners } from './src/AudioProService';

AppRegistry.registerComponent(appName, () => App);
registerAudioProListeners();

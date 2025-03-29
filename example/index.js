import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { setupAudioPro } from './src/player-service';

AppRegistry.registerComponent(appName, () => App);
setupAudioPro();

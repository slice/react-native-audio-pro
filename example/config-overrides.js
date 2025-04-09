// const path = require('path');
const { override, addWebpackAlias } = require('customize-cra');

module.exports = override(
	addWebpackAlias({
		'react-native$': 'react-native-web',
		// Add any other aliases you need
	}),
);

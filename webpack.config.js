const path = require('path');

module.exports = {
	mode: 'production',//'none' | 'development' | 'production'
	entry: './src/index.js',
	output: {
		filename: 'elaphant.web3.provider.min.js',
		path: path.resolve(__dirname, './dist'),
	},
};
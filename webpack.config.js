const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    entry: './index.ts',
    entry: path.resolve(__dirname, 'index.ts'),
    target: 'node',
    node: {
        __filename: false,
        __dirname: false,
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                include: [__dirname],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.ts'],
        alias: {},
    },
    externals: [
        nodeExternals({
            whitelist: /^@casual-simulation/,
        }),
    ], // in order to ignore all modules in node_modules folder
};
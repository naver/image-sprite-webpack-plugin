const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const ImageSpritePlugin = require('image-sprite-webpack-plugin');
// const ImageSpritePlugin = require('../../src/ImageSpritePlugin');

const IS_DEV = process.env.NODE_ENV === 'development';

let config = {
    bail: true,
    entry: path.join(__dirname, '/src/main.js'),
    module: {
        rules: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            exclude: []
        }, {
            test: /\.(png|gif|jpg)$/,
            loader: 'file-loader',
            options: {
                name: 'img/[name]-[hash].[ext]'
            }
        }, {
            test: /\.css$/,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                        sourceMap: true
                    }
                }
            ]
        }]
    },
    output: {
        // a location to the assets will be saved.
        path: IS_DEV
            ? path.resolve(__dirname, 'public')
            : path.resolve(__dirname, 'public/assets'),
        // a path-prefix for resource files.
        publicPath: IS_DEV
            ? '/'
            : '/assets/',
        filename:  IS_DEV
            ? 'bundle.js'
            : 'bundle-[hash].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: __dirname + '/src/main.html',
            filename: IS_DEV
                ? 'index.html'
                : '../index.html'
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: ['node_modules']
    }
};

if (IS_DEV) {
    config = Object.assign(config, {
        mode: 'development',
        devServer: {
            contentBase: path.join(__dirname, 'public'),
            historyApiFallback: {
                disableDotRule: true
            },
            inline: true,
            host: 'localhost',
            hot: true,
            port: 3000,
            public: 'localhost:3000'
        },
        devtool: '#source-map',
    });
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.plugins.push(new ImageSpritePlugin({
        commentOrigin: true,
        compress: false,
        extensions: ['gif', 'png'],
        indent: '  ',
        log: true,
        //outputPath: './public',
        outputFilename: 'css/sprite-[hash].png',
        padding: 10,
        suffix: ''
    }));
} else {
    config.mode = 'production';
    config.plugins.push(new ImageSpritePlugin({
        commentOrigin: false,
        compress: true,
        extensions: ['gif', 'png'],
        indent: '  ',
        log: true,
        //outputPath: './public',
        outputFilename: 'css/sprite-[hash].png',
        padding: 10,
        suffix: '?' + Date.now()
    }));
}

module.exports = config;

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const ImageSpritePlugin = require('../ImageSpritePlugin');

const IS_DEV = process.env.NODE_ENV === 'dev';

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
                name: IS_DEV
                    ? 'img/[name]-[hash].[ext]'
                    : 'img/[hash].[ext]'
            }
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
        }),
        new ExtractTextPlugin({
            filename: IS_DEV
                ? 'css/[name].css'
                : 'css/[name]-[hash].css',
            allChunks: true
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: ['node_modules']
    }
};

if (IS_DEV) {
    config = Object.assign(config, {
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
    })
    config.module.rules.push({
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
            use: [{
                loader: 'css-loader',
                options: {
                    importLoaders: 1,
                    modules: true,
                    sourceMap: true
                }
            }]
        })
    });
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.plugins.push(new ImageSpritePlugin({
        commentOrigin: true,
        compress: false,
        extensions: ['gif', 'png'],
        indent: '  ',
        log: true,
        //outputPath: './public',
        outputFilename: 'css/sprite.png',
        padding: 10,
        suffix: ''
    }));
} else {
    config.module.rules.push({
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [{
                loader: 'css-loader',
                options: {
                    importLoaders: 1,
                    minimize: true,
                    modules: true
                }
            }]
        })
    });
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.plugins.push(new ImageSpritePlugin({
        commentOrigin: false,
        compress: true,
        extensions: ['gif', 'png'],
        indent: '  ',
        log: true,
        //outputPath: './public',
        outputFilename: 'css/sprite.png',
        padding: 10,
        suffix: '?' + Date.now()
    }));
}

module.exports = config;

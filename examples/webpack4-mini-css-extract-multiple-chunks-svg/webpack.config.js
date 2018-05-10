const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');
const ImageSpritePlugin = require('image-sprite-webpack-plugin');
// const ImageSpritePlugin = require('../../src/ImageSpritePlugin');

const IS_DEV = process.env.NODE_ENV === 'development';

// see https://github.com/webpack-contrib/mini-css-extract-plugin
function recursiveIssuer(m) {
    if (m.issuer) {
        return recursiveIssuer(m.issuer);
    } else if (m.name) {
        return m.name;
    }
    return false;
}

let config = {
    bail: true,
    entry: {
        main: path.join(__dirname, '/src/main.js'),
        more: [
            'some-npm-package'
        ]
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            exclude: []
        }, {
            test: /\.(png|gif|jpg|svg)$/,
            loader: 'file-loader',
            options: {
                name: 'img/[name]-[hash].[ext]'
            }
        }, {
            test: /\.css$/,
            use: [
                MiniCssExtractPlugin.loader,
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
        filename: IS_DEV
            ? '[name].js'
            : '[name]-[hash].js',
        chunkFilename: IS_DEV
            ? '[name].js'
            : '[name]-[chunkhash].js'
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                },
                mainStyles: {
                    name: 'main',
                    test: (m, c, entry = 'main') => m.constructor.name === 'CssModule'
                        && recursiveIssuer(m) === entry,
                    chunks: 'all',
                    enforce: true
                },
                moreStyles: {
                    name: 'more',
                    test: (m, c, entry = 'more') => m.constructor.name === 'CssModule'
                        && recursiveIssuer(m) === entry,
                    chunks: 'all',
                    enforce: true
                }
            }
        }
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: IS_DEV
                ? 'css/[name].css'
                : 'css/[name]-[hash].css',
            chunkFilename: IS_DEV
                ? 'css/[name].css'
                : 'css/[name]-[hash].css'
        }),
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
        devtool: '#source-map'
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

const ReplacePlugin = require('webpack-plugin-replace');
const nodeExternals = require('webpack-node-externals');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const path = require('path');

const domain = 'crunchyparty.herokuapp.com'

module.exports = (_, env) => [{
    entry: './src/client',
    output: {
        filename: 'index.js',
        path:  path.resolve(__dirname, 'dist/public'),
        publicPath: `https://${domain}/`
    },
  
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
  
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", '.js']
    },
  
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                loader: "ts-loader",
                options: {
                    // disable type checker - we will use it in fork plugin
                    transpileOnly: true
                  }
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    plugins: [
        // new ReplacePlugin({
        //     values: {
        //         'process.env.SOCKET_SERVER_URL': JSON.stringify(`wss://${domain}`),
        //     }
        // }),
        new ForkTsCheckerWebpackPlugin()
    ]
}, {
    entry: './src/server',
    target: 'node',
    externals: [nodeExternals()],
    output: {
        filename: 'index.js',
        path:  path.resolve(__dirname, 'dist'),
        publicPath: `https://${domain}/`
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                loader: "ts-loader",
                options: {
                    // disable type checker - we will use it in fork plugin
                    transpileOnly: true
                  }
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", '.js']
    },
    plugins: [
        // new ReplacePlugin({
        //     values: {
        //         'process.env.SOCKET_SERVER_URL': JSON.stringify(`wss://${domain}`),
        //     }
        // }),
        new ForkTsCheckerWebpackPlugin()
    ],
  
}]
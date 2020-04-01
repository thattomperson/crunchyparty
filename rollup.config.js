import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import pluginSvelte from 'rollup-plugin-svelte';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const socketServerUrl = dev ? 'ws://localhost:5000' : 'wss://crunchyparty.herokuapp.com' 
const apiServerUrl = dev ? 'http://localhost:5000' : 'https://crunchyparty.herokuapp.com/api' 

export default [{
    input: './client',
    output: {
        dir: './dist/public/',
        format: 'iife'
    },
    plugins: [
        resolve(),
        commonjs(),
        json(),
        replace({
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VERSION': JSON.stringify(pkg.version),
            'process.env.SOCKET_SERVER_URL': JSON.stringify(socketServerUrl),
            'process.env.API_SERVER_URL': JSON.stringify(apiServerUrl),
        }),
        !dev && terser({ module: true }),
        pluginSvelte({ dev, emitCss: true }),
        postcss({
            extract: true,
            minimize: !dev,
            use: [
                ['sass', {
                    includePaths: [
                        './client',
                        './node_modules'
                    ]
                }]
            ]
        })
    ]
}, {
    input: './server/index.ts',
    output: {
        dir: './dist/',
        format: 'cjs'
    },
    plugins: [
        typescript()
    ]
}]
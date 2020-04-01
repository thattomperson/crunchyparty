import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import pluginSvelte from 'rollup-plugin-svelte';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';


const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const serverUrl = dev ? 'ws://localhost:3000' : 'wss://crunchyparty.herokuapp.com' 

export default {
    input: './src',
    output: {
        dir: './public/',
        format: 'iife'
    },
    plugins: [
        resolve(),
        commonjs(),
        json(),
        replace({
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VERSION': JSON.stringify(pkg.version),
            'process.env.SERVER_URL': JSON.stringify(serverUrl),
        }),
        !dev && terser({ module: true }),
        pluginSvelte({ dev, emitCss: true }),
        postcss({
            extract: true,
            minimize: !dev,
            use: [
                ['sass', {
                    includePaths: [
                        './src',
                        './node_modules'
                    ]
                }]
            ]
        })
    ]
}
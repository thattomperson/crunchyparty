import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
 

const mode = process.env.NODE_ENV
const dev = mode == 'development'

console.log()

export default {
    input: './src/index.js',
    output: {
        dir: 'build',
        format: 'esm',
        sourcemap: true,
    },
    plugins: [
        replace({
            'process.env.SOCKET_URL': JSON.stringify(process.env.SOCKET_URL)
        }),
        svelte({
            dev,
            hydratable: false,
            css: (css) => {
                css.write('build/index.css')
            }
        }),
        resolve({
            browser: true,
            dedupe: ['svelte']
        }),
        commonjs(),
    ]
}
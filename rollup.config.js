import { terser } from 'rollup-plugin-terser'

const rollupConfig = {
  input: 'src/LineClamp.js',
  output: [
    { format: 'esm', file: 'dist/esm.js' },
    { format: 'esm', file: 'dist/esm.min.js', plugins: [terser()] },

    { format: 'cjs', file: 'dist/index.js', exports: "default" },
    { format: 'cjs', file: 'dist/index.min.js', plugins: [terser()], exports: 'default' },

    { format: 'umd', file: 'dist/umd.js', name: 'LineClamp' },
    { format: 'umd', file: 'dist/umd.min.js', name: 'LineClamp', plugins: [terser()] },
  ]
}

export default rollupConfig

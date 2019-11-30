import { terser } from 'rollup-plugin-terser'

const rollupConfig = {
  input: 'src/LineClamp.js',
  output: [
    { format: 'esm', file: 'dist/esm.js' },
    { format: 'esm', file: 'dist/esm.min.js' },

    { format: 'cjs', file: 'dist/index.js' },
    { format: 'cjs', file: 'dist/index.min.js' },

    { format: 'umd', file: 'dist/umd.js', name: 'LineClamp' },
    { format: 'umd', file: 'dist/umd.min.js', name: 'LineClamp' },
  ],
  plugins: [terser({
    include: /.+\.min\.js$/i
  })],
}

export default rollupConfig

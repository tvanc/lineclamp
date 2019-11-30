const rollupConfig = {
  input: 'src/LineClamp.js',
  output: [
    {
      file: 'dist/esm.js',
      format: 'esm',
    },
    {
      file: 'dist/index.js',
      format: 'cjs',
    },
    {
      file: 'dist/umd.js',
      format: 'umd',
      name: 'LineClamp'
    },
  ],
}

export default rollupConfig

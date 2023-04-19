import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/json2sql.js',
  platform: "node",
  target: "node16",
  format: "esm",
  //minify: true,
})




const builder = new Bundler({
	source_folder: "src",
	destination_folder: "dist",
	minify: true,
})

builder.transform({
	format: 'amd',
	filename: "$filename.amd.js",
	job: {
		name: 'rollup',
		plugins: {
			babel: {
				presets: [
					["@babel/preset-env",  {
						targets: { ie: 11 }
					}]
				],
				plugins: [
					'syntax-object-rest-spread',
					'transform-modules-amd'
				]
			},
			commonjs: true,
			virtual: true,
		}
	}
})

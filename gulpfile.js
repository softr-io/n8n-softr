const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

function copyIcons() {
	// copy node icons
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes');

	src(nodeSource).pipe(dest(nodeDestination));

	// extra step: copy softr.svg into credential dist
	const softrSource = path.resolve('nodes', 'Softr', 'softr.svg');
	const softrDest = path.resolve('dist', 'credentials');
	src(softrSource).pipe(dest(softrDest))

	// copy credentials icons
	const credSource = path.resolve('credentials', '**', '*.{png,svg}');
	const credDestination = path.resolve('dist', 'credentials');
	return src(credSource).pipe(dest(credDestination));
}



exports.stop = function stop(){
	process.send('stop');
}

exports.restart = function restart(){
	process.send('restart');
}

exports.update = function update(){
	process.send('update');
}

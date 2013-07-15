fs = require('fs');
path = require('path');

var webroot = path.resolve(__dirname + '/../');

function getWorkspace(){
	try{
		config = fs.readFileSync(webroot + '/config.json','utf8');
		config = JSON.parse(config);

		if(!!config.workspace){
            if(fs.existsSync(config.workspace)){
			    return config.workspace;
            }else{
                return null;
            }
		}else{
			return null;
		}
	}catch(ex){
		return null;
	}
}

function getUserConfig(){
	var workspace = getWorkspace(), config = {};

	if(!workspace) return null;

	config.workspace = workspace;

	try{
		config = fs.readFileSync(workspace + '/config.json','utf8');
		config = JSON.parse(config);
		config.workspace = workspace;
	}catch(ex){
		console.log(ex);
	}

	return config;
}

function isConfigOk(config){
	var config = config || getUserConfig();

	if(!config) return false;

	var configAll = fs.readFileSync(webroot + '/source/config.all', 'utf8');

	configAll = JSON.parse(configAll);

	for(var key in configAll){
		if(!config[key] && !configAll[key]['null']){
			return false;
		}

		if(configAll[key]['type'] == 'directory'){
			if(!fs.existsSync(config[key])){
				return false;
			}

			if(!fs.statSync(config[key])){
				return false;
			}
		}
	}

	return true;
}


exports.isConfigOk = isConfigOk;







	// Author - Sakib
	var client = require("./cf-nodejs-client");
	var rl = require('./readline-sync'); 

	endpoint = rl.question('\033[1mEnter API endpoint (default- https://api.ng.bluemix.net) :\033[0m ', {defaultInput: 'https://api.ng.bluemix.net'});
	email = rl.questionEMail('\033[1mEnter e-mail :\033[0m ');
	password = rl.questionNewPassword('\033[1mEnter password :\033[0m ', {min: 8, confirmMessage:'\033[1mConfirm password :\033[0m '});

	const CloudController = new cc.CloudController(endpoint);
	const UsersUAA = new client.UsersUAA;
	const Apps = new client.Apps(endpoint);
	
	CloudController.getInfo().then(
	(res) => 
	{
		UsersUAA.setEndPoint(res.authorization_endpoint);
		return UsersUAA.login(email, password);
    }).then( 
    (res) => 
    {
    	Apps.setToken(res);
    	return Apps.getApps({
    			name:'^\.$'
    		});
    }).then(
    (res) => 
    {
    	console.log('\n\033[1mFound %d apps in %s for %s:\033[0m', res.total_results, endpoint, email);
    	var names = [];
    	for(var i = 0; i < res.total_results; i++)
    	{
    		console.log("Name: %s, Status: %s", res.resources[i].entity.name, res.resources[i].entity.state);
    		names[i] = res.resources[i].entity.name;
    	}
    	
    	var deleted = [];
    	
    	while(true) {
    		array = ['Start an app', 'Stop an app', 'Remove an app', 'View env variables for an app', 'Add env variables for an app', 
    			'Update env variables for an app', 'Remove env variables for an app',
    		'Print app status'], choice = rl.keyInSelect(array, '\033[1mMain Menu:\n>> Enter your choice\033[0m', {cancel:'Logout'});
    	
			if(choice == 0)
			{
				index = rl.keyInSelect(names, '\033[1m1 - Which app do you want to start?\033[0m', {cancel:'Go back'});
				if(index == -1)
					continue;
				else
				{
					Apps.start(res.resources[index].metadata.guid);
					res.resources[index].entity.state = 'STARTED';
					console.log('Ok, app: \x1b[34m' + names[index] + '\x1b[m is \x1b[32mstarted\x1b[m.');
				}		
			}
			else if(choice == 1)
			{
				index = rl.keyInSelect(names, '\033[1m2 - Which app do you want to stop?\033[0m', {cancel:'Go back'});
				if(index == -1)
					continue;
				else
				{
					Apps.stop(res.resources[index].metadata.guid);
					res.resources[index].entity.state = 'STOPPED';
					console.log('Ok, app: \x1b[34m' + names[index] + '\x1b[m is \x1b[31mstopped\x1b[m.');
				}
			}
			else if(choice == 2)
			{
				index = rl.keyInSelect(names, '\033[1m3 - Which app do you want to delete?\033[0m', {cancel:'Go back'});
				if(index == -1)
					continue;
				else
				{
					Apps.remove(res.resources[index].metadata.guid);
					deleted.push(names[index]);
					console.log('Ok, app: \x1b[34m' + names[index] + '\x1b[m is \x1b[31mdeleted\x1b[m.');
				}
			}
			else if(choice == 3)
			{
				index = rl.keyInSelect(names, '\033[1m4 - Which app\'s env variable do you want to view?\033[0m', {cancel:'Go back'});
				
				if(index == -1)
					continue;
				else
				{
					var env = res.resources[index].entity.environment_json;
					var count = 0;
					for(var prop in env) 
					{
						if (env.hasOwnProperty(prop)) {
							++count;
						}
					}
					console.log('There are %d user defined env variables for %s: ', count, names[index]);
					console.log(env);
				}
			}
			else if(choice == 4)
			{
				index = rl.keyInSelect(names, '\033[1m5 - Which app\'s env variable do you want to add?\033[0m', {cancel:'Go back'});
				
				if(index == -1)
					continue;
				else
				{
					var new_env_name = rl.question('Enter the name of new env variable : ');
					var new_env_val = rl.question('Enter the value of new env variable : ');
					
					var envr = {
						'environment_json' : 
						{}
					};
					
					var old_envr = res.resources[index].entity.environment_json;
					
	
					for(var prop in old_envr) {
						if (old_envr.hasOwnProperty(prop)) 
						{
							envr.environment_json[prop] = old_envr[prop];
						}
					}
					
					envr.environment_json[new_env_name]=new_env_val;
					res.resources[index].entity.environment_json[new_env_name] = new_env_val;
					
					Apps.update(res.resources[index].metadata.guid, envr);
				}
				
			}
			else if(choice == 5)
			{
				index = rl.keyInSelect(names, '\033[1m6 - Which app\'s env variable do you want to update?\033[0m', {cancel:'Go back'});
				
				if(index == -1)
					continue;
				else
				{
					var old_envr = res.resources[index].entity.environment_json;
					var props = [];
					var count = 0;
					
					for(var prop in old_envr) {
					if (old_envr.hasOwnProperty(prop)) {
						props[count] = prop;
						++count;
						}
					}
					
					index1 = rl.keyInSelect(props, '\033[1mPlease select which variable you want to update: \033[0m', {cancel:'Go back'});
					
					if(index1 == -1)
						continue;
					else
					{
						//console.log(old_envr[props[index1]]);
						val = rl.question('Enter a new value for ' + props[index1] + ' (old value = ' + old_envr[props[index1]] + ') : ');
					
						var envr = {
							'environment_json' : 
							{}
						};
						
						for(var prop in old_envr) {
							if (old_envr.hasOwnProperty(prop)) 
							{
								if(prop != props[index1])
									envr.environment_json[prop] = old_envr[prop];
								else
									envr.environment_json[props[index1]]=val;	
							}
						}
						res.resources[index].entity.environment_json[props[index1]] = val;
						Apps.update(res.resources[index].metadata.guid, envr);
					}
				}
			}
			else if(choice == 6)
			{
				index = rl.keyInSelect(names, '\033[1m7 - Which app\'s env variable do you want to remove?\033[0m', {cancel:'Go back'});
				
				if(index == -1)
					continue;
				else
				{
					var old_envr = res.resources[index].entity.environment_json;
					var props = [];
					var count = 0;
					
					for(var prop in old_envr) {
					if (old_envr.hasOwnProperty(prop)) {
						props[count] = prop;
						++count;
						}
					}
					
					index1 = rl.keyInSelect(props, '\033[1mPlease select which variable you want to remove: \033[0m', {cancel:'Go back'});
					
					if(index1 == -1)
						continue;
					else
					{
						var envr = {
							'environment_json' : 
							{}
						};
						
						for(var prop in old_envr) {
							if (old_envr.hasOwnProperty(prop)) 
							{
								if(prop == props[index1]);
								else
									envr.environment_json[prop] = old_envr[prop];
									
							}
						}
						delete res.resources[index].entity.environment_json[props[index1]];
						Apps.update(res.resources[index].metadata.guid, envr);
					}
				}
			}
			else if(choice == 7)
			{
				console.log('All app status: ');
				for(var i = 0; i < res.total_results; i++)
				{
					if(deleted.indexOf(res.resources[i].entity.name) > -1);
					else
						console.log("Name: %s, Status: %s", res.resources[i].entity.name, res.resources[i].entity.state);
				}
			}
			else if(choice == -1)
			{
				console.log('Logging out...');
				break;
			}
				
    	};
    	
    }).catch( 
    (res) => 
    {
    	console.error("Error: " + res);
    });
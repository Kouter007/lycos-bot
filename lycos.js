if (process.version.slice(1).split(".")[0] < 12) {throw new Error("Node 12.0.0 or higher is required. Update Node on your system.");}
const { Client, Collection } = require("discord.js");
const { promisify } = require("util"),
	fs = require("fs"),
	path = require("path"),
	readdir = promisify(fs.readdir);
const { Provider, Client: PictURLClient } = require("pict-url");
const { GiveawaysManager } = require("discord-giveaways");
const logs = require('discord-logs');
const { Player } = require("discord-player");
const connection_mysql = require('./utils/connectmysql');
/**
 * @class Lycos
 * @extends {Client}
**/
class Lycos extends Client {
	constructor(options) {
		super(options);
		// This will load the config.js file that contains our basic setup.
		this.config = require("./config.js");
		// Commands are loaded in collections where they can be read from.
		this.commands = new Collection();
		// Aliases are loaded in collections where they can be read from.
		this.aliases = new Collection();
		// Cooldowns
		this.cooldowns = new Collection();
		// Chronos
		this.chronos = new Collection();
		// This is our image module.
		this.pictURL = new PictURLClient(Provider.Imgur);
		// Here we load all our functions stored in functions.js
		this.functions = require("./utils/functions");
		this.player = new Player(this);
		this.gManager = new GiveawaysManager(this, {
			storage: "./giveaways.json",
			updateCountdownEvery: 15000,
			default: {
				botsCanWin: false,
				exemptPermissions: [],
				embedColor: "#1A61BB",
				embedColorEnd: "#262626",
				reaction: "🎉",
			}
		});
		logs(this);

		// This will load our custom Logger class.
		this.logger = require("./utils/logger");
		// This will load our errors file.
		this.errors = require("./utils/errors");
		this._launch();
	}

	async _launch() {
		this.levelCache = {};
		for (let i = 0; i < this.config.permLevels.length; i++) {
			const thisLevel = this.config.permLevels[parseInt(i, 10)];
			this.levelCache[thisLevel.name] = thisLevel.level;
		}

		process.setMaxListeners(0);
		connection_mysql.init();
		this._loadEventsModules();
		this._loadCommandsModules();
		this.login(this.config.token);
	}

	// Method used to get an user permission level on the bot
	getLevel(message) {
		let permissionLevel = 0;
		const permOrder = this.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);
		while (permOrder.length) {
			const currentLevel = permOrder.shift();
			if(message.guild && currentLevel.guildOnly) {
				continue;
			}
			if(currentLevel.check(message)) {
				permissionLevel = currentLevel.level;
				break;
			}
		}
		return permissionLevel;
	}

	// Method used to load a command and add it to the commands Collection
	_loadCommand(commandPath, commandName) {
		try {
			const props = new (require(`${commandPath}${path.sep}${commandName}`))(this);
			props.conf.location = commandPath;
			if (props.init) {
				props.init(this);
			}
			this.commands.set(props.help.name, props);
			props.conf.aliases.forEach((alias) => {
				this.aliases.set(alias, props.help.name);
			});
			return false;
		}
		catch (error) {
			return `Unable to load command ${commandName}: ${error}`;
		}
	}

	// Method used to unload a command (you'll need to load them again)
	async _unloadCommand(commandPath, commandName) {
		let command;
		if(this.commands.has(commandName)) {
			command = this.commands.get(commandName);
		}
		else if(this.aliases.has(commandName)) {
			command = this.commands.get(this.aliases.get(commandName));
		}
		if(!command) {
			return `The command \`${commandName}\` doesn't seem to exist. Try again!`;
		}
		if(command.shutdown) {
			await command.shutdown(this);
		}
		delete require.cache[require.resolve(`${commandPath}${path.sep}${commandName}.js`)];
		return false;
	}

	// Method used to load all the commands modules
	async _loadCommandsModules() {
		const directories = await readdir("./commands/");
		let totalDirectories = 0;
		for (const directory of directories) {
			totalDirectories++;
			const commands = await readdir(`./commands/${directory}/`);
			commands.filter((command) => command.split(".").pop() === "js").forEach((command) => {
				const response = this._loadCommand(`./commands/${directory}`, command);
				if(response) {
					this.logger.log(response, "error");
				}
			});
		}
		console.log(`[Categories] - Loading ${totalDirectories}/${directories.length} categories.`);
	}

	// Method used to load all the events modules
	async _loadEventsModules() {
		const eventFiles = await readdir("./events/");
		let totalEvents = 0;
		eventFiles.forEach((file) => {
			totalEvents++;
			const eventName = file.split(".")[0];
			const event = new (require(`./events/${file}`))(this);
			this.on(eventName, (...args) => event.run(...args));
			delete require.cache[require.resolve(`./events/${file}`)];
		});
		console.log(`[Events] - Loading ${totalEvents}/${eventFiles.length} event(s).`);
	}
}
module.exports.client = new Lycos({
	sync: true,
	autoReconnect: true,
	//fetchAllMembers: true,
	disableEveryone: true,
});

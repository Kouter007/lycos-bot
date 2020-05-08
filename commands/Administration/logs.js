const Command = require("../../base/Command.js");

class Logs extends Command {
	constructor(client) {
		super(client, {
			name: "logs",
			description: (language) => language.get("SETLOGS_DESCRIPTION"),
			usage: (language, prefix) => language.get("SETLOGS_USAGE", prefix),
			examples: (language, prefix) => language.get("SETLOGS_EXAMPLES", prefix),
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			permLevel: "Server Admin",
            botPermissions: ["EMBED_LINKS"],
            aliases: ["setlogs"],
			nsfw: false,
			adminOnly: true,
			cooldown: 1000,
		});
	}

	async run(message, args) {
		try {
			var sql = `SELECT *
					   FROM Guilds
					   WHERE guild_id="${message.guild.id}"`;
			var g;
			mysqlcon.query(sql, async function (err, result, fields) {
				g = result[0];
				var chan = args[0];
			if (!chan) {
				message.channel.send(message.language.get("SETLOGS_NO_ARGS", g));
				chan = await message.bot.functions.awaitResponse(message);
			}
			let c = message.guild.channels.resolve(chan) || message.guild.channels.resolveID(chan);
			let cid = c.toString().slice(2, c.toString().length -1) || c.id;
            if (cid === g.logs_channel) {
                return message.channel.send(message.language.get("SETLOGS_SAME", cid))
            } 
			mysqlcon.query("UPDATE Guilds SET logs_channel = ? WHERE guild_id = ?", [cid, message.guild.id]);
			return message.channel.send(message.language.get("SETLOGS_SUCCESS", cid));
		});
		}
		catch (error) {
			console.error(error);
			return message.channel.send(message.language.get("ERROR", error));
		}
	}
}

module.exports = Logs;

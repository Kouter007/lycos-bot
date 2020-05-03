const Command = require("../../base/Command.js");

class Leave extends Command {
	constructor(client) {
		super(client, {
			name: "setleave",
			description: (language) => language.get("PREFIX_DESCRIPTION"),
			usage: (language, prefix) => language.get("PREFIX_USAGE", prefix),
			examples: (language, prefix) => language.get("PREFIX_EXAMPLES", prefix),
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			permLevel: "Server Admin",
            botPermissions: ["EMBED_LINKS"],
            aliases: [],
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
			if (!args[0]) {
				return message.channel.send(message.language.get("SETLEAVE_NO_ARGS", g));
			}
			let c = message.guild.channels.resolve(args[0]) || message.guild.channels.resolveID(args[0]);
			let cid = c.toString().slice(2, c.toString().length -1) || c.id;
            if (cid === g.leave_channel) {
                return message.channel.send(message.language.get("SETLEAVE_SAME", cid))
            }
            sql = `UPDATE Guilds 
				SET leave_channel=${cid}
				WHERE guild_id="${message.guild.id}";`;
			mysqlcon.query(sql, async function (err, result, fields) {
			});
			return message.channel.send(message.language.get("SETLEAVE_SUCCESS", cid));
		});
		}
		catch (error) {
			console.error(error);
			return message.channel.send(message.language.get("ERROR", error));
		}
	}
}

module.exports = Leave;

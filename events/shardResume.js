module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(id, replayedEvents) {
		this.client.guilds.cache.get("627946609896062986").channels.cache.get("712635877729239081").send(`Shard ${id} reconnectée, ${replayedEvents} évènements rejoués.`)
		
	}
};

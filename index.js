const { RTMClient } = require('@slack/rtm-api');
const { WebClient } = require('@slack/web-api');
const fs = require('fs');
const token = process.env.SLACK_TOKEN;
const giphy = require('giphy-api')('fcPl68xP0ipqvy2pQHl5h5wiQA5SjSOA');
const rtm = new RTMClient(token);
const slack = new WebClient(token);
rtm.start().catch(console.err);

const SLACK_CHANNEL = 'GJ759MWUC';
const WAITING = 'waiting-to-start';
const GUESSING = 'guessing-in-progress';


var gameState = {
	type: WAITING
}

rtm.on('ready', async () => {
	//rtm.sendMessage('Ready for the next game! Be the first to send in a DM with your keywords!', 'GJ759MWUC');	
});

rtm.on('message', async (msg) => {
	if(msg['subtype'] || msg['bot_id']) return;
	await processMessage(msg.channel, msg.user, msg.text);
	console.log(msg);
});

rtm.on('user_typing', (event) => {
	console.log(event);
});

function setWaiting() {
	gameState = {type: WAITING}
}

function setGuessing() {
	gameState = {type: GUESSING, startTime: new Date().getTime()}
}

function isGameChannel(channelId) {
	return channelId === SLACK_CHANNEL;
}

async function processMessage(channelId, userId, text) {
	switch(gameState.type) {
		case WAITING:
		if(isGameChannel(channelId)) {
			
		} else {
			await waitingProcessDM(channelId, userId, text);
		}
			break;	
		case GUESSING:
		if(isGameChannel(channelId)) {
			guessingProcessMessage(channelId, userId, text);
		}
			break;
	}
}

async function waitingProcessDM(channelId, userId, text) {
	rtm.sendMessage('Searching GIPHY for "' + text + '"', channelId);
	giphy.search(text, async (err, res) => {
		if(err) return rtm.sendMessage(err, channelId);
		res.data = res.data.slice(0, 5);
		var random = res.data[Math.floor(Math.random() * res.data.length)];
		console.log(res);
		var gifMsg = await rtm.sendMessage(random.bitly_url, channelId);
		var msg = await rtm.sendMessage('*-=LEADERBOARD=-*', channelId);
		fs.writeFileSync('./leaderboard_ts', msg.ts);
		await slack.chat.update({ts: msg.ts, text: '*=LEADERBOARD=-*\nCameron - 0', channel: channelId});
		console.log(msg);
		setTimeout(() => {
			slack.chat.update({channel: channelId, ts: gifMsg.ts, text: `*Time remaining: {Math.floor(((gameState.startTime + 30000) - gameState.startTime) / 1000)} seconds\n{random.bitly_url}`}); 
		}, 800);
	});
}

function guessingProcessMessage(userId, text) {
	
}

setWaiting();

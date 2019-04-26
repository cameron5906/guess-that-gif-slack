const { RTMClient } = require('@slack/rtm-api');
const { WebClient } = require('@slack/web-api');
const fs = require('fs');
const token = process.env.SLACK_TOKEN;
const giphy = require('giphy-api')(process.env.GIPHY_TOKEN);
const rtm = new RTMClient(token);
const slack = new WebClient(token);
rtm.start().catch(console.err);

const SLACK_CHANNEL = 'GJ759MWUC';
const WAITING = 'waiting-to-start';
const GUESSING = 'guessing-in-progress';

var leaderboardTimestamp = "0";

var gameState = {
	type: WAITING
}

rtm.on('ready', async () => {
	//rtm.sendMessage('Ready for the next game! Be the first to send in a DM with your keywords!', 'GJ759MWUC');	
	if(fs.existsSync("./leaderbord_ts")) {
		leaderboardTimestamp = fs.readFileSync("./leaderbord_ts");
	} else {
		var leaderboard = await rtm.sendMessage("*-=LEADERBOARD=-*\nNo one has won any rounds yet", SLACK_CHANNEL);
		leaderboardTimestamp = leaderboard.ts;
		fs.writeFileSync('./leaderbord_ts', leaderboard.ts);
	}
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

function setGuessing(gifThread, gifData) {
	gameState = {
		type: GUESSING, 
		startTime: new Date().getTime(),
		secondsRemaining: 30,
		roundInterval: setInterval(() => {
			gameState.secondsRemaining--;
			if(gameState.secondsRemaining <= 0) {
				clearInterval(gameState.roundInterval);
				slack.chat.postMessage({
					channel: SLACK_CHANNEL,
					text: 'Time\'s up!',
					thread_ts: gifThread
				});
			} else {
				if(gameState.secondsRemaining % 10 === 0) {
					slack.chat.postMessage({
						channel: SLACK_CHANNEL,
						text: `${gameState.secondsRemaining} seconds remaining!`,
						thread_ts: gifThread
					});
				}
			}
		}, 1000)
	}

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
	giphy.search(text, async (err, res) => {
		if(err) return rtm.sendMessage(err, channelId);
		res.data = res.data.slice(0, 5);
		var random = res.data[Math.floor(Math.random() * res.data.length)];
		console.log(res);
		var gifMsg = await rtm.sendMessage(random.bitly_url, SLACK_CHANNEL);
		setGuessing(gifMsg.ts, random);
		console.log(msg);
	});
}

function guessingProcessMessage(userId, text) {
	
}

setWaiting();

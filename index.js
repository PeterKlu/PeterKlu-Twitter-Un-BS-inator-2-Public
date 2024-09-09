const { REST, Routes, Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions] });

/* File Paths */
const BLACKLIST_FILE_PATH = './jsons/whitelisted-ids.json';

/* Command Imports */
const config = require('./config.json');
const init = require('./commands/init');
const blacklist = require('./commands/blacklist');
const whitelist = require('./commands/whitelist');
const deleteMessage = require('./commands/deleteMessage');

/* Command Names */
const BLACKLIST_CMD = 'blacklist';
const WHITELIST_CMD = 'whitelist';

/* All Versions of Twitter Links */
const TWITTER_LINK = 'https://twitter.com/';
const X_LINK = 'https://x.com/';
const FXTWITTER_LINK = 'https://fxtwitter.com/';
const SPACES_LINK_SEGMENT = '/i/spaces';
const TWITTER_LINK_REGEX = /https:\/\/twitter\.com\//;
const X_LINK_REGEX = /https:\/\/x\.com\//;
const FULL_MODIFIED_LINK_REGEX = /(https:\/\/fxtwitter\.com\/\S+\/\d+)|(\|\|\s*https:\/\/fxtwitter\.com\/\S+\/\d+(\?s=+\d+\s*)*\|\|)/gm;
const TWITTER_LINK_WITH_SPOILER_REGEX = /\|\|\s*https:\/\/twitter\.com\/.*\|\|/
const X_LINK_WITH_SPOILER_REGEX = /\|\|\s*https:\/\/x\.com\/.*\|\|/

/** A list of strings that represent blacklisted IDs */
var whitelistedUsers = require(BLACKLIST_FILE_PATH).flatMap(val => val);

const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);

client.login(config.BOT_TOKEN);

client.on(Events.ClientReady, () => { 
    client.user.setStatus('online');
    init(client.application.commands, BLACKLIST_CMD, WHITELIST_CMD);
    client.user.setActivity('Fixing Twitter Links');
    console.log('Successfully started');
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.webhookId != null || !whitelistedUsers.some(value => value === message.author.id) || message.content.includes(SPACES_LINK_SEGMENT)) {
        return;
    }
    const IS_TWITTER_LINK = TWITTER_LINK_REGEX.test(message.content);
    const IS_X_LINK = X_LINK_REGEX.test(message.content);
    if (IS_TWITTER_LINK || IS_X_LINK) {
        const BASE_LINK = IS_TWITTER_LINK ? TWITTER_LINK : X_LINK;
        var messageContent = message.content;
        var hasSpoiler = TWITTER_LINK_WITH_SPOILER_REGEX.test(messageContent) || X_LINK_WITH_SPOILER_REGEX.test(messageContent);
        do {
            messageContent = messageContent.replace(BASE_LINK, FXTWITTER_LINK);
        } while (messageContent.includes(BASE_LINK));
        messageContent
            .match(FULL_MODIFIED_LINK_REGEX)
            ?.forEach(messageContentMatch => {
                if (hasSpoiler) {
                    messageContentMatch = '||' + messageContentMatch + '||';
                }
                message
                    .reply({ content: messageContentMatch, allowedMentions: { repliedUser: false }})
                    .catch((error) => console.log(error.message));
                message.suppressEmbeds();
            });
    }    
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.emoji.name === '❌') {
        deleteMessage(reaction, user, config.APPLICATION_ID);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    (updateWhitelist(interaction)).then(() => {
        whitelistedUsers = returnValueFromFile(BLACKLIST_FILE_PATH);
    });
    return;
});

async function updateWhitelist(interaction) {
    if (interaction.commandName === BLACKLIST_CMD) {
        await blacklist(whitelistedUsers, fs, interaction, BLACKLIST_FILE_PATH);
    } else if (interaction.commandName === WHITELIST_CMD) {
        await whitelist(whitelistedUsers, fs, interaction, BLACKLIST_FILE_PATH);
    }    
}

function returnValueFromFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName));
}

const write = require('./fileWriteAndRespond');

async function whitelist(blacklistedUsers, fs, interaction, filePath) {
    const INTERACTION_USER_ID = interaction?.user?.id;
    if (!blacklistedUsers.some(id => id === INTERACTION_USER_ID)) {
        blacklistedUsers.push(INTERACTION_USER_ID.toString());
        const json = JSON.stringify(blacklistedUsers, 'whitelisted-ids', 2);
        await write(fs, filePath, json, `Successfully opted in <@${INTERACTION_USER_ID}>`, interaction);
    } else {
        await interaction
            .reply({ content: "You've already opted in", ephemeral: true })
            .catch((error) => console.log(error.message));
    }
}

module.exports = whitelist;
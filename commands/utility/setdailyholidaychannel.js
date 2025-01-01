var { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../auto_holiday_data.json');

// Function to fetch guild and channel information
function fetch_guild_and_channel(interaction) {
    const guildId = interaction.guildId; // Get the guild ID
    const channelId = interaction.channelId; // Get the channel ID
    const now = Date.now(); // Current timestamp
    return { guildId, channelId, now };
}

// Function to read the JSON file
function get_json() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const rawData = fs.readFileSync(dataFilePath, 'utf8');
            return JSON.parse(rawData);
        } else {
            return { guilds: {} }; // Default structure if file doesn't exist
        }
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return { guilds: {} };
    }
}

// Function to write data to the JSON file
function write_to_file(guildId, channelId, now) {
    const jsonData = get_json();

    // Update or add new guild settings
    if (!jsonData.guilds[guildId]) {
        jsonData.guilds[guildId] = {};
    }

    jsonData.guilds[guildId] = {
        channel_id: channelId,
        time: 0,
        enabled: false // Default to disabled
    };

    // Write updated data back to the file
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing to JSON file:", err);
    }
}                   /** krutch, naruzkurai, pl8o */
var allowed_user_ids = ["313800057541623809", "751907539444170875", "175658817210679296"]
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setdailyholidaychannel')
        .setDescription('Sets the channel for automatic holiday announcements'),
    async execute(interaction) {
        if (!allowed_user_ids.includes(interaction.user.id)) {
            //if user is server owner, allow
            if (interaction.guild.ownerId === interaction.user.id) {
                //do nothing
            } else {
            await interaction.reply("You do not have permission to use this command.");
            return;
        }
        }
        // Fetch guild and channel info
        const { guildId, channelId, now } = fetch_guild_and_channel(interaction);

        // Write the data to the JSON file
        write_to_file(guildId, channelId, now);

        // Respond to the user
        let allowed_user = interaction.user.id;
        const message = `Allowed user ${allowed_user} ran a command that (re)sets the auto_holiday function to run in this guild's channel,  Guild ID: ${guildId}, Channel ID: ${channelId}, at UTC Time: ${new Date(now).toLocaleString()}`;
        await interaction.reply(message);
    },
};

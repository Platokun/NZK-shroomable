var { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../auto_holiday_data.json');

function get_json() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const rawData = fs.readFileSync(dataFilePath, 'utf8');
            return JSON.parse(rawData);
        } else {
            return null;
        }
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return null;
    }
}

function write_json(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing to JSON file:", err);
    }
}

var allowed_user_ids = ["313800057541623809", "751907539444170875", "175658817210679296"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setdailyholidayenabled')
        .setDescription('Enables or disables automatic holiday announcements for this server')
        .addBooleanOption(option => 
            option.setName('enabled')
                .setDescription('Enable or disable the auto holiday announcements')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!allowed_user_ids.includes(interaction.user.id)) {
            if (interaction.guild.ownerId === interaction.user.id) {
                // Server owner is allowed
            } else {
                await interaction.reply("You do not have permission to use this command.");
                return;
            }
        }

        const enabled = interaction.options.getBoolean('enabled');
        const guildId = interaction.guildId;
        const channelId = interaction.channelId;

        const data = get_json();
        if (!data) {
            await interaction.reply("The auto holiday system is not set up. Please use `/setdailyholidaychannel` first.");
            return;
        }

        if (!data.guilds[guildId]) {
            await interaction.reply("This server is not configured for auto holidays. Please use `/setdailyholidaychannel` first.");
            return;
        }

        // Update the `enabled` status
        data.guilds[guildId].enabled = enabled;
        write_json(data);

        await interaction.reply(`Auto holiday announcements have been ${enabled ? 'enabled' : 'disabled'} for this server.`);
    },
};

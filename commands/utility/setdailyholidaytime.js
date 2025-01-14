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
        .setName('setdailyholidaytime')
        .setDescription('Sets the target time for daily holiday announcements in UTC')
        .addIntegerOption(option =>
            option.setName('hour')
                .setDescription('Hour of the day (0-23)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Minutes of the hour (0-59)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('when')
                .setDescription('Set the time for today or tomorrow (default: today)')
                .addChoices(
                    { name: 'Today', value: 'today' },
                    { name: 'Tomorrow', value: 'tomorrow' }
                )
                .setRequired(false)),
    async execute(interaction) {
        if (!allowed_user_ids.includes(interaction.user.id)) {
            if (interaction.guild.ownerId === interaction.user.id) {
                // Server owner is allowed
            } else {
                await interaction.reply("You do not have permission to use this command.");
                return;
            }
        }

        const hour = interaction.options.getInteger('hour');
        const minutes = interaction.options.getInteger('minutes');
        const when = interaction.options.getString('when') || 'today'; // Default to "today"

        if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) {
            await interaction.reply("Invalid time specified. Please ensure hour is between 0-23 and minutes between 0-59.");
            return;
        }

        const now = new Date();
        const data = get_json();
        if (!data || !data.guilds[interaction.guildId]) {
            await interaction.reply("This server is not configured for auto holidays. Please use `/setdailyholidaychannel` first.");
            return;
        }

        // Calculate the user's offset relative to UTC
        const utcOffset = -now.getTimezoneOffset() / 60; // Local time offset in hours
        const userOffset = (utcOffset - hour)+1; // Offset based on user-provided time relative to UTC also off by 1 errors suck

        // Calculate the `next run` based on `when`
        const nextRunDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + (when === 'tomorrow' ? 1 : 0), // Add 1 day if "tomorrow"
            hour,
            minutes,
            0
        );

        // Update the guild data
        const guildData = data.guilds[interaction.guildId];
        guildData["target time"] = { hour, minutes };
        guildData["next run"] = nextRunDate.getTime();
        guildData["last ran"] = 0; // Reset "last ran"
        guildData["timezone"] = userOffset; // Store the timezone offset

        write_json(data);

        await interaction.reply(
            `Daily holiday announcements' target time has been set to ${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} UTC, scheduled for ${when.toUpperCase()}.\n` +
            `Your timezone offset is UTC${userOffset >= 0 ? '+' : ''}${userOffset}.`+
            `next run is ${nextRunDate.toLocaleString()}`
        );
    },
};




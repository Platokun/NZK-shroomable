const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token, clientId } = require('./config.json');
const autoHolidayDataPath = path.join(__dirname, './auto_holiday_data.json');
const commands = [];
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
function printAutoHolidayData() {
    try {
        const data = fs.readFileSync(autoHolidayDataPath, 'utf-8');
        console.log('auto_holiday_data.json contents:', JSON.parse(data));
    } catch (error) {
        console.error('Error reading auto_holiday_data.json:', error);
    }
}

async function logLastBotMessage(guildId, channelId) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return console.error(`Guild not found: ${guildId}`);

        const channel = guild.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) return console.error(`Channel not found or not text-based: ${channelId}`);

        const messages = await channel.messages.fetch({ limit: 10 });
        const lastBotMessage = messages.find(msg => msg.author.id === client.user.id);

        if (!lastBotMessage) {
            console.log(`No recent messages found from the bot in guild ${guildId}, channel ${channelId}.`);
            return;
        }

        const timestamp = lastBotMessage.createdAt;
        const date = `${timestamp.getFullYear().toString().slice(-2)}/${String(timestamp.getMonth() + 1).padStart(2, '0')}/${String(timestamp.getDate()).padStart(2, '0')}`;
        const time = `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}:${String(timestamp.getSeconds()).padStart(2, '0')}`;
        const server_name = guild.name;
        console.log('\n-----------------------------------');
        console.log(`Last bot message in guild, ${server_name} ${guildId}, channel ${channelId} at ${date}, ${time}:`);
        console.log();
        console.log(lastBotMessage.content);
        console.log();
    } catch (error) {
        console.error(`Error fetching last bot message for guild ${guildId}, channel ${channelId}:`, error);
    }
}

function logLastMessagesFromConfig() {
    try {
        const data = JSON.parse(fs.readFileSync(autoHolidayDataPath, 'utf-8'));
        for (const guildId in data.guilds) {
            const { channel_id: channelId } = data.guilds[guildId];
            logLastBotMessage(guildId, channelId);
        }
    } catch (error) {
        console.error('Error reading or processing auto_holiday_data.json:', error);
    }
}

function loadCommands(dir) {
    // Load commands once globally
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }
}

async function clearAndRegisterCommands() {
    const guilds = await client.guilds.fetch();
    const rest = new REST({ version: '9' }).setToken(token);

    for (const guild of guilds.values()) {
        try {
            // Clear and register commands per guild
            await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] });
            await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commands });
        } catch (error) {
            console.error(`Error handling guild ${guild.id}:`, error);
        }
    }
}

client.once(Events.ClientReady, async () => {
    console.log('Client ready. Loading commands...');
    loadCommands(path.join(__dirname, 'commands'));
    console.log('Commands loaded. Clearing and registering commands...');
    await clearAndRegisterCommands();
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});
//1x/10sec
setInterval(logLastMessagesFromConfig, 10000);
client.login(token);

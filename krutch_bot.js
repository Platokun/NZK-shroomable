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

function getAutoHolidayData() {
    try {
        if (fs.existsSync(autoHolidayDataPath)) {
            return JSON.parse(fs.readFileSync(autoHolidayDataPath, 'utf-8'));
        } else {
            return { guilds: {} };
        }
    } catch (error) {
        console.error('Error reading auto_holiday_data.json:', error);
        return { guilds: {} };
    }
}

function saveAutoHolidayData(data) {
    try {
        fs.writeFileSync(autoHolidayDataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving auto_holiday_data.json:', error);
    }
}

async function fetchAndParseHolidays() {
    const url = 'https://nationaltoday.com/today/';
    try {
        const response = await fetch(url);
        const html = await response.text();
        const lines = html.split('\n');
        const holidayLines = lines.filter(line => line.includes('holiday-title'));
        const regex = />\s*(.*?)\s*</;
        const holidays = holidayLines.map(line => {
            const match = regex.exec(line);
            return match ? match[1] : null;
        }).filter(Boolean).filter(holiday => !holiday.includes('Birthday'));
        return holidays.sort();
    } catch (error) {
        console.error('Error fetching or parsing holidays:', error);
        return [];
    }
}

function number_to_th(number) {
    number = number.toString();
    if (number.endsWith('1') && !number.endsWith('11')) return number + 'st';
    if (number.endsWith('2') && !number.endsWith('12')) return number + 'nd';
    if (number.endsWith('3') && !number.endsWith('13')) return number + 'rd';
    return number + 'th';
}

async function runHolidayForGuild(guildId, channelId) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`Guild not found: ${guildId}`);
            return;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) {
            console.error(`Channel not found or not text-based: ${channelId}`);
            return;
        }

        const holidays = await fetchAndParseHolidays();
        const today = new Date();
        const day = number_to_th(today.getDate());
        const month = number_to_th(today.getMonth() + 1);
        const year = today.getFullYear();

        let message = `Today is the ${month} month on the ${day} day of the year ${year}, and today's holidays are:\n`;
        holidays.forEach(holiday => {
            message += `${holiday}\n`;
        });
        console.log(message);
        await channel.send(message);

        // Update the `last ran` time for this guild
        const data = getAutoHolidayData();
        if (data.guilds[guildId]) {
            data.guilds[guildId]['last ran'] = Date.now();
            saveAutoHolidayData(data);
        }
    } catch (error) {
        console.error(`Error running holiday for guild ${guildId}:`, error);
    }
}

function checkAndRunHolidays() {
    const data = getAutoHolidayData();
    const now = new Date();

    for (const guildId in data.guilds) {
        const guildData = data.guilds[guildId];
        const targetTime = guildData['target time'];
        const nextRunTimestamp = guildData['next run'];
        const enabled = guildData.enabled;

        // Skip if not enabled or missing target time
        if (!enabled || !targetTime) continue;

        // If `next run` is not set, initialize it to today at the target time
        if (!nextRunTimestamp) {
            const initialNextRun = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                targetTime.hour,
                targetTime.minutes,
                0
            ).getTime();
            guildData['next run'] = initialNextRun;
            saveAutoHolidayData(data);
            continue; // Skip this iteration, we'll pick it up next time
        }

        // Check if `now` is greater than `next run`
        if (now.getTime() > nextRunTimestamp) {
            // Run the holiday function
            runHolidayForGuild(guildId, guildData.channel_id);

            // Calculate the next run: tomorrow at the target time
            const nextRunDate = new Date(nextRunTimestamp);
            const nextRun = new Date(
                nextRunDate.getFullYear(),
                nextRunDate.getMonth(),
                nextRunDate.getDate() + 1, // Move to the next day
                targetTime.hour,
                targetTime.minutes,
                0
            ).getTime();

            // Update `next run`
            guildData['next run'] = nextRun;
            saveAutoHolidayData(data);
        }
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
//setInterval(logLastMessagesFromConfig, 10000);
// Run the function every unit of time (e.g., 10 seconds)
// Run the function every unit of time (e.g., 1 minute)
setInterval(checkAndRunHolidays, 6000);


client.login(token);

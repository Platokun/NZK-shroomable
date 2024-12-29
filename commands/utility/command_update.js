// this file is named template.js and it is located in path: */bot/commands/ at */bot/commands/template.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('update_commands')
        .setDescription('Update all commands')
        .addStringOption(option => 
            option.setName('scope')
            .setDescription('Scope of the update')
            .setRequired(true)
            // Corrected usage of addChoices method
            .addChoices(
                { name: 'global', value: 'global' },
                { name: 'local', value: 'local' }
            )
        ),
    
    async execute(interaction) {
        const dir = './commands'; // Directory where your command files are located
        const commands = []; // Array to store your commands

        console.log('Updating commands...');
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

        const scope = interaction.options.getString('scope');

        // Register slash command data
        if (scope === 'local') {
            // Local update. Registering slash commands to dev guilds only.
            for (let guildId of DEV_GUILD_IDS) {
                await client.application.commands.set(commands, guildId).then(function (cmds) {
                    console.log(`${client.user.username}: Registered LOCAL slash commands for guild: ${guildId}`);
                }).catch(console.error);
            }
        } else {
            // Global update. Registering slash commands globally.
            await client.application.commands.set(commands).then(function (cmds) {
                console.log(`${client.user.username}: Registered GLOBAL slash commands.`);
            }).catch(console.error);
        }

        await interaction.reply(`Commands updated ${scope}.`);
    },
};
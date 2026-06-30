const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');

// --- SERVEUR DE SANTÉ (Pour éviter le crash sur Canner) ---
const app = express();
app.listen(process.env.PORT || 3000, '0.0.0.0');

// --- BASE DE DONNÉES ---
const db = new sqlite3.Database('./erlc_stats.db');
db.run("CREATE TABLE IF NOT EXISTS users (discord_id TEXT PRIMARY KEY, api_key TEXT)");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- FONCTION API RÉELLE ---
async function getPlayerStats(apiKey) {
    try {
        // MODIFIE L'URL AVEC TON VRAI LIEN API
        const response = await fetch(`https://ton-api-erlc.com/data?key=${apiKey}`);
        if (!response.ok) return null;
        return await response.json(); 
    } catch (e) { return null; }
}

// --- COMMANDES ---
const commands = [
    new SlashCommandBuilder().setName('link').setDescription('Lier clé API').addStringOption(o => o.setName('key').setRequired(true).setDescription('Ta clé')),
    new SlashCommandBuilder().setName('stat').setDescription('Voir stats').addUserOption(o => o.setName('user').setRequired(true).setDescription('Joueur'))
];

client.once('clientReady', async (c) => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('Bot opérationnel.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'link') {
        db.run("INSERT OR REPLACE INTO users (discord_id, api_key) VALUES (?, ?)", [interaction.user.id, interaction.options.getString('key')]);
        await interaction.reply({ content: '✅ Lié.', ephemeral: true });
    }

    if (interaction.commandName === 'stat') {
        const target = interaction.options.getUser('user');
        db.get("SELECT api_key FROM users WHERE discord_id = ?", [target.id], async (err, row) => {
            if (!row) return interaction.reply("❌ Joueur non lié.");
            
            const stats = await getPlayerStats(row.api_key);
            if (!stats) return interaction.reply("❌ API injoignable.");

            const embed = new EmbedBuilder()
                .setTitle(`Stats: ${target.username}`)
                .addFields(
                    { name: 'Pompier', value: `XP: ${stats.pompier.xp}`, inline: true },
                    { name: 'Police', value: `XP: ${stats.police.xp}`, inline: true }
                );
            await interaction.reply({ embeds: [embed] });
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');

// 1. Serveur de santé (pour Canner)
const app = express();
app.get('/', (req, res) => res.send('Bot est en ligne !'));
app.listen(3000, () => console.log('Serveur de santé actif.'));

// 2. Base de données
const db = new sqlite3.Database('./erlc_stats.db');
db.run("CREATE TABLE IF NOT EXISTS users (discord_id TEXT PRIMARY KEY, api_key TEXT)");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 3. Commandes
const commands = [
    new SlashCommandBuilder().setName('link').setDescription('Lier votre clé API')
        .addStringOption(option => option.setName('key').setDescription('Votre clé API').setRequired(true)),
    new SlashCommandBuilder().setName('stat').setDescription('Voir les stats d\'un joueur')
        .addUserOption(option => option.setName('user').setDescription('Joueur cible').setRequired(true))
];

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Bot prêt et commandes synchronisées.');
    } catch (error) { console.error(error); }
});

// 4. Logique Interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'link') {
        const key = interaction.options.getString('key');
        db.run("INSERT OR REPLACE INTO users (discord_id, api_key) VALUES (?, ?)", [interaction.user.id, key]);
        await interaction.reply({ content: '✅ Clé API liée.', ephemeral: true });
    }

    if (interaction.commandName === 'stat') {
        const target = interaction.options.getUser('user');
        db.get("SELECT api_key FROM users WHERE discord_id = ?", [target.id], async (err, row) => {
            if (!row) return interaction.reply("❌ Joueur non lié.");
            
            // Simule l'appel API. Remplacez par votre fetch() réel ici.
            const stats = {
                pompier: { xp: "3720 / 18000", prix: "491 750 $" },
                mtq: { xp: "4775 / 4750", prix: "955 000 $" },
                police: { xp: "10538 / 20000", prix: "1 378 350 $" }
            };

            const embed = new EmbedBuilder()
                .setTitle(`📊 Stats de ${target.username}`)
                .setColor(0x0099ff)
                .addFields(
                    { name: '🚒 Pompier', value: `XP: ${stats.pompier.xp}\nPrix: ${stats.pompier.prix}` },
                    { name: '🚧 MTQ', value: `XP: ${stats.mtq.xp}\nPrix: ${stats.mtq.prix}` },
                    { name: '🚔 Police', value: `XP: ${stats.police.xp}\nPrix: ${stats.police.prix}` }
                );
            await interaction.reply({ embeds: [embed] });
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// 1. Initialisation Base de données
const db = new sqlite3.Database('./erlc_stats.db');
db.run("CREATE TABLE IF NOT EXISTS users (discord_id TEXT PRIMARY KEY, api_key TEXT)");

// 2. Client Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 3. Définition des commandes
const commands = [
    new SlashCommandBuilder()
        .setName('link')
        .setDescription('Lier votre clé API ERLC')
        .addStringOption(option => option.setName('key').setDescription('Votre clé').setRequired(true)),
    new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Afficher les statistiques d\'un joueur')
        .addUserOption(option => option.setName('user').setDescription('Joueur à cibler').setRequired(true))
];

// 4. Démarrage et Synchronisation
client.once('ready', async (c) => {
    console.log(`Connecté en tant que ${c.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
        console.log('Commandes synchronisées avec succès !');
    } catch (error) {
        console.error('Erreur lors de la synchro des commandes :', error);
    }
});

// 5. Gestion des interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // COMMANDE /link
    if (interaction.commandName === 'link') {
        const key = interaction.options.getString('key');
        db.run("INSERT OR REPLACE INTO users (discord_id, api_key) VALUES (?, ?)", [interaction.user.id, key], (err) => {
            if (err) return interaction.reply({ content: '❌ Erreur base de données.', ephemeral: true });
            interaction.reply({ content: '✅ Clé API enregistrée avec succès.', ephemeral: true });
        });
    }

    // COMMANDE /stat
    if (interaction.commandName === 'stat') {
        const target = interaction.options.getUser('user');
        
        db.get("SELECT api_key FROM users WHERE discord_id = ?", [target.id], async (err, row) => {
            if (err || !row) return interaction.reply({ content: '❌ Ce joueur n\'a pas configuré sa clé API.', ephemeral: true });
            
            // Appel API (Remplace l'URL par la tienne)
            try {
                const response = await fetch(`https://api.ton-serveur-erlc.com/stats?key=${row.api_key}`);
                const stats = await response.json();

                const embed = new EmbedBuilder()
                    .setTitle(`📊 Statistiques de ${target.username}`)
                    .setColor(0x0099ff)
                    .addFields(
                        { name: '🚒 Pompier', value: `XP: ${stats.pompier.xp}\nArgent: ${stats.pompier.argent}`, inline: false },
                        { name: '🚔 Police', value: `XP: ${stats.police.xp}\nArgent: ${stats.police.argent}`, inline: false }
                    );
                await interaction.reply({ embeds: [embed] });
            } catch (e) {
                await interaction.reply({ content: '❌ Impossible de récupérer les stats depuis l\'API.', ephemeral: true });
            }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

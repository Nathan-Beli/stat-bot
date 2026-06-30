const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Base de données pour stocker le lien (ID Discord -> API Key)
const db = new sqlite3.Database('./erlc_stats.db');
db.run("CREATE TABLE IF NOT EXISTS users (discord_id TEXT PRIMARY KEY, api_key TEXT)");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Définition des commandes
const commands = [
    new SlashCommandBuilder().setName('link').setDescription('Configurer votre clé API pour le serveur')
        .addStringOption(option => option.setName('key').setDescription('Votre clé API').setRequired(true)),
    new SlashCommandBuilder().setName('stat').setDescription('Voir les stats d\'un joueur')
        .addUserOption(option => option.setName('user').setDescription('Joueur à cibler').setRequired(true))
];

client.once('ready', async () => {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Bot en ligne et commandes prêtes.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // 1. Commande /link : Configure l'API pour l'utilisateur
    if (interaction.commandName === 'link') {
        const key = interaction.options.getString('key');
        db.run("INSERT OR REPLACE INTO users (discord_id, api_key) VALUES (?, ?)", [interaction.user.id, key]);
        await interaction.reply({ content: '✅ API configurée pour votre compte.', ephemeral: true });
    }

    // 2. Commande /stat (User) : Utilise l'API configurée pour ce joueur
    if (interaction.commandName === 'stat') {
        const targetUser = interaction.options.getUser('user');
        
        // Va chercher la clé du joueur cible dans la DB
        db.get("SELECT api_key FROM users WHERE discord_id = ?", [targetUser.id], async (err, row) => {
            if (!row) return interaction.reply("❌ Ce joueur n'a pas configuré son API avec /link.");

            // Ici, vous faites votre fetch avec row.api_key
            // const response = await fetch(`URL_API?key=${row.api_key}`);
            
            // Exemple visuel (Embed)
            const embed = new EmbedBuilder()
                .setTitle(`📊 Statistiques de ${targetUser.username}`)
                .setColor(0x0099ff)
                .setDescription("Données récupérées via l'API configurée du joueur.");
            
            await interaction.reply({ embeds: [embed] });
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

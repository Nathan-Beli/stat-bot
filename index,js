const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// 1. Initialisation de la base de données persistante
const db = new sqlite3.Database('./erlc_stats.db');
db.run("CREATE TABLE IF NOT EXISTS users (discord_id TEXT PRIMARY KEY, api_key TEXT)");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 2. Commande dynamique avec options
const commands = [
    new SlashCommandBuilder().setName('link').setDescription('Lier votre clé API ERLC')
        .addStringOption(option => option.setName('key').setDescription('Votre clé').setRequired(true)),
    new SlashCommandBuilder().setName('stat').setDescription('Afficher vos statistiques')
];

// 3. Logique de récupération des stats (Simulé ici)
// C'est ici que tu brancheras ton API ERLC réelle
async function getERLCStats(apiKey) {
    // REMPLACE CECI PAR UNE REQUÊTE fetch() VERS TON API ERLC
    return {
        pompier: { xp: "3720 / 18000", prix: "491 750 $", veh: "8 / 23" },
        mtq: { xp: "4775 / 4750", prix: "955 000 $", veh: "13 / 22" },
        police: { xp: "10538 / 20000", prix: "1 378 350 $", veh: "21 / 46" }
    };
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'link') {
        const key = interaction.options.getString('key');
        db.run("INSERT OR REPLACE INTO users (discord_id, api_key) VALUES (?, ?)", [interaction.user.id, key]);
        await interaction.reply({ content: '✅ Clé enregistrée.', ephemeral: true });
    }

    if (interaction.commandName === 'stat') {
        db.get("SELECT api_key FROM users WHERE discord_id = ?", [interaction.user.id], async (err, row) => {
            if (!row) return interaction.reply("❌ Faites d'abord /link.");
            
            const stats = await getERLCStats(row.api_key);
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Statistiques ERLC')
                .setColor(0x0099ff)
                .addFields(
                    { name: '🚒 Pompier', value: `XP: ${stats.pompier.xp}\nPrix: ${stats.pompier.prix}`, inline: false },
                    { name: '🚧 MTQ', value: `XP: ${stats.mtq.xp}\nPrix: ${stats.mtq.prix}`, inline: false },
                    { name: '🚔 Police', value: `XP: ${stats.police.xp}\nPrix: ${stats.police.prix}`, inline: false }
                );
            await interaction.reply({ embeds: [embed] });
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

import discord
from discord import app_commands
from discord.ext import commands
import sqlite3
import requests

# 1. Configuration et Base de données
TOKEN = 'VOTRE_TOKEN_ICI'
db = sqlite3.connect("bot_data.db")
cursor = db.cursor()
cursor.execute("CREATE TABLE IF NOT EXISTS users (discord_id INTEGER PRIMARY KEY, api_key TEXT)")
db.commit()

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)

# 2. Commande /link
@bot.tree.command(name="link", description="Lier votre compte ERLC avec votre clé API")
async def link(interaction: discord.Interaction, api_key: str):
    cursor.execute("INSERT OR REPLACE INTO users (discord_id, api_key) VALUES (?, ?)", (interaction.user.id, api_key))
    db.commit()
    await interaction.response.send_message("✅ Compte lié avec succès !", ephemeral=True)

# 3. Commande /stat
@bot.tree.command(name="stat", description="Voir vos statistiques ERLC")
async def stat(interaction: discord.Interaction, user: discord.Member = None):
    target = user or interaction.user
    cursor.execute("SELECT api_key FROM users WHERE discord_id = ?", (target.id,))
    result = cursor.fetchone()

    if not result:
        await interaction.response.send_message("❌ Utilisateur non lié. Utilisez /link d'abord.", ephemeral=True)
        return

    api_key = result[0]
    
    # Appel API (Remplacez l'URL par la vraie URL de votre API ERLC)
    try:
        # response = requests.get(f"https://api.votre-serveur.com/data?key={api_key}")
        # data = response.json()
        
        # Simulation des données basées sur votre image (à remplacer par data['...'])
        embed = discord.Embed(title="📊 Statistique ERLC", color=discord.Color.dark_grey())
        embed.add_field(name="🚒 Pompier", value="XP: 3720 / 18000\nPrix: 491 750 $\nVéhicules: 8 / 23", inline=False)
        embed.add_field(name="🚧 MTQ", value="XP: 4775 / 4750 (Terminé)\nPrix: 955 000 $\nVéhicules: 13 / 22", inline=False)
        embed.add_field(name="🚔 Police", value="XP: 10538 / 20000\nPrix: 1 378 350 $\nVéhicules: 21 / 46", inline=False)
        embed.set_footer(text=f"Total véhicules: 52 / 199 | Total prix: 15 784 551 $")
        
        await interaction.response.send_message(embed=embed)
    except Exception as e:
        await interaction.response.send_message("Erreur lors de la récupération des données API.", ephemeral=True)

@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f'Bot prêt : {bot.user}')

import os

# Remplacez TOKEN = 'VOTRE_TOKEN_ICI' par ceci :
TOKEN = os.getenv('DISCORD_TOKEN') # Ou le nom exact de votre variable d'environnement

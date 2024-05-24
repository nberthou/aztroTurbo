import { Client, Events, GatewayIntentBits } from 'discord.js';
require('dotenv').config();

class DiscordBot {
  private readonly token: string;
  private client: Client;
  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN!;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
      ],
    });
    this.setUpListeners();
  }

  private setUpListeners = (): void => {
    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`${readyClient.user.tag} est connecté à Discord.`);
    });
  };

  public start = (): void => {
    this.client.login(this.token);
  };
}

const bot = new DiscordBot();
bot.start();

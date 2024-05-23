import { Client, GatewayIntentBits } from 'discord.js';
require('dotenv').config();

class DiscordBot {
  constructor() {}

  public helloWorld = () => {
    console.log('Hello World');
  };
}

const bot = new DiscordBot();
bot.helloWorld();

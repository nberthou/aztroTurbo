import {
  Client,
  Collection,
  CommandInteraction,
  Events,
  GatewayIntentBits,
  GuildEmoji,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { getAllCommands } from '@repo/db/command';
import path from 'path';
import fs from 'node:fs';
require('dotenv').config();

export type DiscordClient = Client & { commands?: Collection<string, any> };

class DiscordBot {
  private readonly token: string;
  private readonly clientId: string;
  private readonly guildId: string;
  static client: DiscordClient;
  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN!;
    this.clientId = process.env.DISCORD_CLIENT_ID!;
    this.guildId = process.env.DISCORD_GUILD_ID!;
    DiscordBot.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
      ],
    });
    DiscordBot.client.commands = new Collection();
    this.setUpListeners();
  }

  private setUpListeners = (): void => {
    DiscordBot.client.once(Events.ClientReady, (readyClient) => {
      console.log(`${readyClient.user.tag} est connecté à Discord.`);
    });
  };

  static getEmoji = (emojiName: string): GuildEmoji | null => {
    return this.client.emojis.cache.find((emoji) => emoji.name === emojiName) || null;
  };

  public start = async (): Promise<void> => {
    const dbCommands = await getAllCommands();
    const formattedCommands = dbCommands.map((command) => ({
      data: new SlashCommandBuilder().setName(command.name).setDescription(`${command.content.slice(0, 50)}...`),
      async execute(interaction: CommandInteraction) {
        await interaction.reply(
          command.content
            .split(' ')
            .map((w) => DiscordBot.getEmoji(w) || w)
            .join(' ')
        );
      },
    }));

    for (const command of formattedCommands) {
      if ('data' in command && 'execute' in command) {
        DiscordBot.client.commands!.set(command.data.name, command);
      }
    }

    const commandsFoldersPath = path.join(__dirname, 'commands');
    // How to find all .ts files in commands folder and its subfolders? --> https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
    // const commandsFiles = fs.readdirSync(commandsFoldersPath).filter((file) => file.endsWith('.ts'));
    // const commandsFolders = fs.readdirSync(commandsFoldersPath).filter((folder) => !folder.endsWith('.ts'));

    console.debug('--------------------------------------------');
    console.debug('main.ts commandsFolders l.72', commandsFoldersPath);
    console.debug('--------------------------------------------');
    const commandsSubFolders = fs.readdirSync(commandsFoldersPath).filter((folder) => !folder.endsWith('.ts'));
    const commandsFiles = fs
      .readdirSync(commandsFoldersPath)
      .filter((file) => file.endsWith('.ts'))
      .map((file) => ({ folder: commandsFoldersPath, file }));
    for (const subFolder of commandsSubFolders) {
      const subFolderPath = path.join(commandsFoldersPath, subFolder);
      const subFolderFiles = fs.readdirSync(subFolderPath).filter((file) => file.endsWith('.ts'));
      commandsFiles.push(...subFolderFiles.map((file) => ({ folder: subFolderPath, file })));
    }

    for (const file of commandsFiles) {
      const filePath = path.join(file.folder, file.file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        DiscordBot.client.commands!.set(command.data.name, command);
      } else {
        console.log(`Command ${filePath} not formatted correctly`);
      }
    }

    const rest = new REST().setToken(this.token);
    (async () => {
      try {
        console.log(`Actualisation des ${DiscordBot.client.commands!.size} commandes Discord.`);
        const data: any = await rest.put(Routes.applicationGuildCommands(this.clientId, this.guildId), {
          body: DiscordBot.client.commands!.map((command) => command.data.toJSON()),
        });

        console.log(`${data.length} commands ont été actualisées.`);
      } catch (error) {
        console.error(error);
      }
    })();

    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

    for (const file of eventFiles) {
      const event = require(path.join(eventsPath, file));
      DiscordBot.client.on(event.name, event.execute);
    }

    DiscordBot.client.login(this.token);
  };
}

const bot = new DiscordBot();
bot.start();

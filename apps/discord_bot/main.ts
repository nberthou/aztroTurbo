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

export class DiscordBot {
  private readonly token: string;
  private readonly clientId: string;
  private readonly guildId: string;
  static client: DiscordClient;

  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN!;
    this.clientId = process.env.DISCORD_CLIENT_ID!;
    this.guildId = process.env.DISCORD_GUILD_ID!;
    this.initializeClient();
  }

  private initializeClient(): void {
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

  private setUpListeners(): void {
    DiscordBot.client.once(Events.ClientReady, (readyClient) => {
      console.log(`${readyClient.user.tag} est connecté à Discord.`);
    });
  }

  static getEmoji(emojiName: string): GuildEmoji | null {
    return this.client.emojis.cache.find((emoji) => emoji.name === emojiName) || null;
  }

  public async start(): Promise<void> {
    await this.loadCommands();
    await this.registerCommands();

    await this.loadEvents();
    DiscordBot.client.login(this.token);
  }

  private async loadCommands(): Promise<void> {
    const dbCommands = await getAllCommands();
    const formattedCommands = this.formatDbCommands(dbCommands);
    this.loadCommandFiles(formattedCommands);
  }

  private formatDbCommands(dbCommands: any[]): any[] {
    return dbCommands.map((command) => ({
      data: new SlashCommandBuilder().setName(command.name).setDescription(`${command.content.slice(0, 50)}...`),
      async execute(interaction: CommandInteraction) {
        await interaction.reply(
          command.content
            .split(' ')
            .map((w: string) => DiscordBot.getEmoji(w) || w)
            .join(' ')
        );
      },
    }));
  }

  private loadCommandFiles(formattedCommands: any[]): void {
    const commandsFoldersPath = path.join(__dirname, 'commands');
    const commandFiles = this.getCommandFiles(commandsFoldersPath);

    for (const command of [...formattedCommands, ...commandFiles]) {
      if ('data' in command && 'execute' in command) {
        DiscordBot.client.commands!.set(command.data.name, command);
      } else {
        console.log(`Commande non formatée correctement: ${command.filePath || 'Commande de base de données'}`);
      }
    }
  }

  private getCommandFiles(folderPath: string): any[] {
    const files = fs.readdirSync(folderPath);
    const commandFiles = files.filter((file) => file.endsWith('.ts')).map((file) => ({ folder: folderPath, file }));
    const subFolders = files.filter((folder) => !folder.endsWith('.ts'));

    for (const subFolder of subFolders) {
      const subFolderPath = path.join(folderPath, subFolder);
      const subFolderFiles = fs.readdirSync(subFolderPath).filter((file) => file.endsWith('.ts'));
      commandFiles.push(...subFolderFiles.map((file) => ({ folder: subFolderPath, file })));
    }

    return commandFiles.map((file) => require(path.join(file.folder, file.file)));
  }

  private async registerCommands(): Promise<void> {
    const rest = new REST().setToken(this.token);
    try {
      console.log(`Actualisation des ${DiscordBot.client.commands!.size} commandes Discord.`);
      const data: any = await rest.put(Routes.applicationGuildCommands(this.clientId, this.guildId), {
        body: DiscordBot.client.commands!.map((command) => command.data.toJSON()),
      });
      console.log(`${data.length} commandes ont été actualisées.`);
    } catch (error) {
      console.error(error);
    }
  }

  private async loadEvents(): Promise<void> {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

    for (const file of eventFiles) {
      const event = require(path.join(eventsPath, file));
      DiscordBot.client.on(event.name, event.execute);
    }
  }
}

const bot = new DiscordBot();
bot.start();

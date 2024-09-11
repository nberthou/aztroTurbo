import { GuildEmoji } from 'discord.js';
import { DiscordBot } from './main';

export function getEmoji(emojiName: string): GuildEmoji | null {
  const guild = DiscordBot.client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
  return guild?.emojis.cache.find((emoji) => emoji.name === emojiName) || null;
}

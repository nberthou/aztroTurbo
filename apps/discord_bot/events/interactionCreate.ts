import { CacheType, Events, Interaction } from 'discord.js';
import type { DiscordClient } from '../main';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction<any>) {
    const discordClient = interaction.client as DiscordClient;
    if (!interaction.isChatInputCommand()) return;
    const command = discordClient.commands!.get(interaction.commandName);
    if (!command) {
      console.error(`La commande ${interaction.commandName} n'a pas été trouvée sur ce serveur.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) return;
    }
  },
};

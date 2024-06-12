import { CacheType, Events, Interaction } from 'discord.js';
import type { DiscordClient } from '../main';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction<any>) {
    const discordClient = interaction.client as DiscordClient;
    if (!interaction.isChatInputCommand()) return;
    const command = discordClient.commands!.get(interaction.commandName);
    console.debug('--------------------------------------------');
    console.debug('interactionCreate.ts interaction.guild.commands l.7', discordClient.commands);
    console.debug('--------------------------------------------');

    if (!command) {
      console.error(`La commande ${interaction.commandName} n'a pas été trouvée sur ce serveur.`);
      return;
    }

    try {
      console.debug('--------------------------------------------');
      console.debug('interactionCreate.ts interaction l.14');
      console.debug('--------------------------------------------');

      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) return;
    }
  },
};

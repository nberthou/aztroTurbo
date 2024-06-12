import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder().setName('test').setDescription('Commande test'),
  async execute(interaction: CommandInteraction) {
    console.debug('--------------------------------------------');
    console.debug('test.ts test l.5');
    console.debug('--------------------------------------------');
  },
};

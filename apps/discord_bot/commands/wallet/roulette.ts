import { ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { UserService } from '@repo/user-service';
import { ActionRowBuilder, Colors, CommandInteraction, EmbedBuilder, SlashCommandBuilder, TextInputStyle } from 'discord.js';
import { DiscordBot } from '../../main';

module.exports = {
  data: new SlashCommandBuilder().setName('roulette').setDescription('Joue à la roulette pour gagner (ou perdre) des étoiles !'),
  async execute(interaction: CommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('rouletteModal')
      .setTitle('Jouer à la roulette')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('starsRouletteInput')
            .setLabel("Nombre d'étoiles")
            .setPlaceholder("Le nombre d'étoiles que tu veux miser")
            .setStyle(TextInputStyle.Short)
        )
      );

    await interaction.showModal(modal);
    const modalSubmit = await interaction.awaitModalSubmit({ time: 60_000 });
    await modalSubmit.deferReply();

    const starsAmount = parseInt(modalSubmit.fields.getTextInputValue('starsRouletteInput'), 10);
    if (isNaN(starsAmount)) {
      await modalSubmit.editReply({ embeds: [createErrorEmbed('Le nombre que tu as spécifié est invalide !')] });
      return;
    }

    const user = await UserService.create(interaction.user.id);
    if (user.wallet!.stars < starsAmount) {
      await modalSubmit.editReply({ embeds: [createErrorEmbed("Tu n'as pas assez d'étoiles !")] });
      return;
    }

    const hasWon = Math.random() < 0.5;
    await user.wallet[hasWon ? 'addStars' : 'spendStars'](starsAmount);

    const newStarCount = user.wallet.stars;
    const resultEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('Résultat de la roulette')
      .setDescription(
        `Tu as ${hasWon ? 'gagné' : 'perdu'} ${starsAmount} étoiles ! Tu as désormais ${newStarCount} étoiles ! ${DiscordBot.getEmoji(hasWon ? 'azgoldStar' : 'azgoldSad')}`
      );
    await modalSubmit.editReply({ embeds: [resultEmbed] });
  },
};

function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(Colors.Red).setTitle('Erreur').setDescription(message);
}

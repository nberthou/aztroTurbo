import { UserService } from '@repo/user-service';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { DiscordBot } from '../../main';

enum ShifumiChoice {
  ROCK = 'ROCK',
  PAPER = 'PAPER',
  SCISSORS = 'SCISSORS',
}

const choices = [
  { customId: ShifumiChoice.ROCK, label: '🗿 Pierre', style: ButtonStyle.Danger },
  { customId: ShifumiChoice.PAPER, label: '📄 Feuille', style: ButtonStyle.Success },
  { customId: ShifumiChoice.SCISSORS, label: '✂️ Ciseaux', style: ButtonStyle.Primary },
];

const winConditions = {
  [ShifumiChoice.ROCK]: ShifumiChoice.SCISSORS,
  [ShifumiChoice.PAPER]: ShifumiChoice.ROCK,
  [ShifumiChoice.SCISSORS]: ShifumiChoice.PAPER,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shifumi')
    .setDescription('Joue à pierre, feuille, ciseaux pour tenter de remporter des étoiles !'),
  async execute(interaction: CommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('shifumiModal')
      .setTitle('Jouer à Pierre, feuille, ciseaux')
      .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('starsShifumiInput')
            .setLabel("Nombre d'étoiles")
            .setPlaceholder("Le nombre d'étoiles que tu veux miser")
            .setStyle(TextInputStyle.Short)
        )
      );

    await interaction.showModal(modal);
    const modalInteraction = await interaction.awaitModalSubmit({ time: 60_000 });
    await modalInteraction.deferReply();

    const starsAmount = parseInt(modalInteraction.fields.getTextInputValue('starsShifumiInput'), 10);

    if (isNaN(starsAmount)) {
      await modalInteraction.editReply({ embeds: [createErrorEmbed('Le nombre que tu as spécifié est invalide !')] });
      return;
    }

    const user = await UserService.create(interaction.user.id, 'DISCORD');

    if (user.wallet.stars < starsAmount) {
      await modalInteraction.editReply({ embeds: [createErrorEmbed("Tu n'as pas assez d'étoiles !")] });
      return;
    }

    const shifumiStartEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('Pierre, feuille, ciseaux')
      .setDescription(`Tu as misé ${starsAmount} étoiles. Maintenant, tu dois choisir entre pierre, feuille et ciseaux.`);

    const shifumiActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      choices.map((choice) => new ButtonBuilder().setCustomId(choice.customId).setLabel(choice.label).setStyle(choice.style))
    );
    const response = await modalInteraction.editReply({ components: [shifumiActionRow], embeds: [shifumiStartEmbed] });
    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

    collector.on('collect', async ({ customId: userChoice }) => {
      const botChoice = choices[Math.floor(Math.random() * choices.length)]?.customId;
      let embed: EmbedBuilder;

      if (userChoice === botChoice) {
        embed = new EmbedBuilder()
          .setColor(Colors.Gold)
          .setTitle('Pierre, feuille, ciseaux')
          .setDescription(`Égalité ! Tu récupères tes ${starsAmount} étoiles ! ${DiscordBot.getEmoji('azgoldLUL')}`);
      } else if (winConditions[userChoice as keyof typeof winConditions] === botChoice) {
        const winAmount = starsAmount * 1.5;
        await user.wallet.addStars(winAmount);
        embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Pierre, feuille, ciseaux')
          .setDescription(
            `Tu remportes ${winAmount} étoiles ! Tu as désormais ${user.wallet.stars} ! ${DiscordBot.getEmoji('azgoldHF')}`
          );
      } else {
        await user.wallet.spendStars(starsAmount);
        embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Pierre, feuille, ciseaux')
          .setDescription(
            `Tu as perdu ! Tu perds ${starsAmount} étoiles ! Tu as désormais ${user.wallet.stars} étoiles ! ${DiscordBot.getEmoji('azgoldSad')}`
          );
      }

      await modalInteraction.editReply({ embeds: [embed], components: [] });
    });
  },
};

function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(Colors.Red).setTitle('Erreur').setDescription(message);
}

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, SlashCommandBuilder } from 'discord.js';

import { getUsersRank } from '@repo/db/user/discord';
import { getUsersRankEmbed } from '../events/ready';
import { UserService } from '@repo/user-service';

enum ButtonType {
  NEXT = 'NEXT',
  BACK = 'BACK',
}

export const getRank = async (interaction: CommandInteraction): Promise<any> => {
  let count = 0;
  let users = await Promise.all(
    (await getUsersRank(count)).map(async (user) =>
      user.discordId ? await UserService.create(user.discordId, 'DISCORD') : await UserService.create(user.twitchId, 'TWITCH')
    )
  );

  const backButton = new ButtonBuilder()
    .setCustomId(ButtonType.BACK)
    .setLabel('◀️ Précédent')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(count === 0);

  const nextButton = new ButtonBuilder().setCustomId(ButtonType.NEXT).setLabel('Suivant ▶️').setStyle(ButtonStyle.Primary);
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

  const usersRankEmbed = await getUsersRankEmbed(users);
  const response = await interaction.reply({ components: [], embeds: [usersRankEmbed] });
  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

  collector.on('collect', async ({ customId }) => {
    if (customId === ButtonType.NEXT) {
      count++;
    } else {
      count--;
    }
    users = await Promise.all(
      (await getUsersRank(count)).map(async (user) =>
        user.discordId ? await UserService.create(user.discordId, 'DISCORD') : await UserService.create(user.twitchId, 'TWITCH')
      )
    );

    const usersRankEmbed = await getUsersRankEmbed(users);
    if (interaction.createdTimestamp + 60000 >= Date.now()) {
      backButton.setDisabled(count === 0);
    }
    await response.edit({ components: [], embeds: [usersRankEmbed] });
  });
};

module.exports = {
  data: new SlashCommandBuilder().setName('rank').setDescription("Regarde qui sont les personnes possédant le plus d'étoiles !"),
  async execute(interaction: CommandInteraction) {
    await getRank(interaction);
  },
};

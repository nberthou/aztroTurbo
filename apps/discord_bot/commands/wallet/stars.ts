import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getUserByDiscordId } from '@repo/db/user/discord';
import { getEmoji } from '../../utils';

module.exports = {
  data: new SlashCommandBuilder().setName('stars').setDescription('Commande wallet stars'),

  async execute(interaction: CommandInteraction) {
    const { displayName, id: userId } = interaction.user;
    const currentUser = await getUserByDiscordId(userId);

    const embed = new EmbedBuilder().setColor(Colors.Gold).setTitle(`Les étoiles de ${displayName}`);

    if (!currentUser) {
      embed.setDescription(`${displayName}, tu n'es pas enregistré sur le bot !`);
    } else {
      const starCount = currentUser.stars;
      const starEmoji = getEmoji('azgoldStar') || getEmoji('smiley');

      const pluriel = starCount > 1 ? 's' : '';
      embed.setDescription(`${displayName}, tu as ${starCount} étoile${pluriel} ! ${starEmoji}`);

      if (!currentUser.twitchId) {
        embed.addFields({
          name: "Ton compte Twitch n'est pas lié !",
          value: 'Tu peux cliquer sur le bouton ci-dessous pour lier ton compte Twitch et synchroniser tes étoiles.',
        });
      }
    }

    const redirectUrl = `https://api.azgold.fr/aztro-link`;

    const linkButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Lier mon compte Twitch')
      .setURL(
        `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${process.env.TWITCH_CLIENT_ID ?? ''}&scope=user_read&redirect_uri=${redirectUrl}&state=${userId}`
      );

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

    await interaction.reply({
      embeds: [embed],
      components: currentUser?.twitchId ? [] : [actionRow],
      ephemeral: true,
    });
  },
};

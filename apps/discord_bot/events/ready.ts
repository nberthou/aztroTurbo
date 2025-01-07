import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  Events,
  TextChannel,
} from 'discord.js';
import { DiscordBot, DiscordClient } from '../main';
import { UserService } from '@repo/user-service';
import { getUsersRank } from '@repo/db/user/discord';
import { connectRedis, redisPublisher, redisSubscriber } from '@repo/redis';

const getMembers = async (users: UserService[]) => {
  const guild = DiscordBot.getGuild();
  const members = guild.members.cache;

  const promises = users.map(async (user) => {
    const guildMember = members.find((member) => !member.user.bot && member.user.id === user?.platformId);

    const userChannel = `twitch-username-${user.platformId}`; // Canal spécifique à l'utilisateur
    redisPublisher.publish('twitch-id', user?.platformId!);

    // Attendre la réponse de Redis sur le canal spécifique de l'utilisateur
    const username = await new Promise<string>((resolve) => {
      redisSubscriber.subscribe(userChannel, (twitchUsername) => {
        if (user?.platform === 'TWITCH') {
          resolve(twitchUsername); // Si l'utilisateur est de type Twitch, on renvoie le nom d'utilisateur
        } else if (user?.platform === 'DISCORD') {
          resolve(guildMember?.displayName!); // Si l'utilisateur est de type Discord, on prend son display name
        } else {
          resolve('cc'); // Valeur par défaut si rien d'autre ne correspond
        }
      });
    });

    return {
      name: username,
      value: `${user?.wallet.stars} ${DiscordBot.getEmoji('azgoldStar')} `,
    };
  });

  // Attendre que toutes les promesses soient résolues
  return Promise.all(promises);
};

export const getUsersRankEmbed = async (users: UserService[]) => {
  const rankMembers = await getMembers(users);

  const fields = await Promise.all(
    rankMembers.map((member) => {
      return {
        name: member.name,
        value: member.value,
      };
    })
  );

  return new EmbedBuilder().setColor(Colors.Gold).setTitle('Classement des étoiles').addFields(fields).setTimestamp();
};

const updateRankMessage = () => {
  const guild = DiscordBot.getGuild();
  let count = 0;

  setInterval(
    () => {
      const channel = guild.channels.cache.find(
        (chan) => chan.id === process.env.DISCORD_RANK_CHANNEL_ID
      ) as BaseGuildTextChannel;
      channel.messages.fetch({ limit: 1 }).then(async (messages) => {
        const message = messages.first();
        if (message) {
          let users = await Promise.all(
            (await getUsersRank(count)).map(async (user) =>
              user.discordId
                ? await UserService.create(user.discordId, 'DISCORD')
                : await UserService.create(user.twitchId, 'TWITCH')
            )
          );
          const backButton = new ButtonBuilder()
            .setCustomId('BACK')
            .setLabel('◀️ Précédent')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(count === 0);
          const userRankEmbed = await getUsersRankEmbed(users);
          const nextButton = new ButtonBuilder().setCustomId('NEXT').setLabel('Suivant ▶️').setStyle(ButtonStyle.Primary);
          const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);
          const response = await message.edit({ components: [], embeds: [userRankEmbed] });
          const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });
          collector.on('collect', async ({ customId }) => {
            if (customId === 'NEXT') {
              count++;
            } else {
              count--;
            }
            users = await Promise.all(
              (await getUsersRank(count)).map(async (user) =>
                user.discordId
                  ? await UserService.create(user.discordId, 'DISCORD')
                  : await UserService.create(user.twitchId, 'TWITCH')
              )
            );
            const userRankEmbed = await getUsersRankEmbed(users);
            backButton.setDisabled(count === 0);
            await message.edit({ components: [], embeds: [userRankEmbed], content: '' });
          });
        } else {
          // Send a new message
          let users = await Promise.all(
            (await getUsersRank(count)).map(async (user) =>
              user.discordId
                ? await UserService.create(user.discordId, 'DISCORD')
                : await UserService.create(user.twitchId, 'TWITCH')
            )
          );
          const backButton = new ButtonBuilder()
            .setCustomId('BACK')
            .setLabel('◀️ Précédent')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(count === 0);
          const userRankEmbed = await getUsersRankEmbed(users);
          const nextButton = new ButtonBuilder().setCustomId('NEXT').setLabel('Suivant ▶️').setStyle(ButtonStyle.Primary);
          const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);
          const response = await channel.send({ components: [], embeds: [userRankEmbed] });
          const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });
          collector.on('collect', async ({ customId }) => {
            if (customId === 'NEXT') {
              count++;
            } else {
              count--;
            }
            users = await Promise.all(
              (await getUsersRank(count)).map(async (user) =>
                user.discordId
                  ? await UserService.create(user.discordId, 'DISCORD')
                  : await UserService.create(user.twitchId, 'TWITCH')
              )
            );
            const userRankEmbed = await getUsersRankEmbed(users);
            backButton.setDisabled(count === 0);
            await response.edit({ components: [], embeds: [userRankEmbed], content: '' });
          });
        }
      });
    },
    1000 * 60 * 5
  );
};

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: DiscordClient) {
    await connectRedis();
    redisSubscriber.subscribe('discord-announcement', async (message) => {
      const channel = client.channels.cache.get(process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID!);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send(message);
      }
    });
    updateRankMessage();
  },
};

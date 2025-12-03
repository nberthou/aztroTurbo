import { BaseGuildTextChannel, Colors, EmbedBuilder, Events, Message, TextChannel } from 'discord.js';
import { DiscordBot, DiscordClient } from '../main';
import { UserService } from '@repo/user-service';
import { getUsersRank } from '@repo/db/user/discord';
import { connectRedis, redisPublisher, redisSubscriber } from '@repo/redis';
import { platform } from 'os';

interface RankMember {
  name: string;
  value: string;
}

const twitchUsernameCache = new Map<string, string>();

const getMembers = async (users: UserService[]): Promise<RankMember[]> => {
  const guild = DiscordBot.getGuild();

  const promises = users.map(async (user): Promise<RankMember> => {
    console.log('user', user);
    try {
      if (user?.platform === 'TWITCH' && user.platformId) {
        let username = twitchUsernameCache.get(user.platformId);

        if (!username) {
          const userChannel = `twitch-username-${user.platformId}`;
          redisPublisher.publish('twitch-id', user.platformId);

          username = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout getting Twitch username'));
            }, 5000);

            redisSubscriber.subscribe(userChannel, (twitchUsername) => {
              clearTimeout(timeout);
              redisSubscriber.unsubscribe(userChannel);
              resolve(twitchUsername);
            });
          });

          twitchUsernameCache.set(user.platformId, username);
        }

        return {
          name: username,
          value: `${user.wallet.stars} ${DiscordBot.getEmoji('azgoldStar')}`,
        };
      } else if (user?.platform === 'DISCORD' && user.platformId) {
        const guildMember = await guild.members.fetch(user.platformId);
        return {
          name: guildMember?.user.displayName || 'Utilisateur Discord inconnu',
          value: `${user.wallet.stars} ${DiscordBot.getEmoji('azgoldStar')}`,
        };
      } else {
        return {
          name: 'Utilisateur inconnu',
          value: `${user?.wallet?.stars || 0} ${DiscordBot.getEmoji('azgoldStar')}`,
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du membre:', error);
      return {
        name: 'Erreur de récupération',
        value: `0 ${DiscordBot.getEmoji('azgoldStar')}`,
      };
    }
  });

  return Promise.all(promises);
};

export const getUsersRankEmbed = async (users: UserService[]): Promise<EmbedBuilder> => {
  try {
    const rankMembers = await getMembers(users);
    console.log('Rank Members récupérés:', rankMembers.length);

    const fields = rankMembers.map((member, index) => ({
      name: `${index + 1}. ${member.name}`,
      value: member.value,
      inline: true,
    }));

    return new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('🏆 Top 10 - Classement des étoiles')
      .addFields(fields)
      .setTimestamp();
  } catch (error) {
    console.error("Erreur lors de la création de l'embed du classement:", error);
    return new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('❌ Erreur')
      .setDescription('Impossible de charger le classement.')
      .setTimestamp();
  }
};

let rankUpdateInterval: NodeJS.Timeout | null = null;

const updateRankMessage = async (): Promise<void> => {
  try {
    const guild = DiscordBot.getGuild();
    const channel = guild.channels.cache.find((chan) => chan.id === process.env.DISCORD_RANK_CHANNEL_ID) as BaseGuildTextChannel;

    if (!channel) {
      console.error('Canal de classement introuvable');
      return;
    }

    const users = await Promise.all(
      (await getUsersRank(0)).map(async (user) =>
        user.discordId ? await UserService.create(user.discordId, 'DISCORD') : await UserService.create(user.twitchId!, 'TWITCH')
      )
    );

    const embed = await getUsersRankEmbed(users);

    const messages = await channel.messages.fetch({ limit: 1 });
    const existingMessage = messages.first();

    if (existingMessage) {
      await existingMessage.edit({
        embeds: [embed],
        components: [],
      });
      console.log('Message de classement mis à jour');
    } else {
      console.log('Nouveau message de classement envoyé');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message de classement:', error);
  }
};

const startRankUpdateScheduler = (): void => {
  if (rankUpdateInterval) {
    clearInterval(rankUpdateInterval);
  }

  updateRankMessage();

  rankUpdateInterval = setInterval(
    () => {
      console.log('Mise à jour programmée du classement...');
      updateRankMessage();
    },
    5 * 60 * 1000
  );
};

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: DiscordClient) {
    try {
      console.log('🚀 Initialisation du bot Discord...');

      await connectRedis();
      console.log('✅ Connexion à Redis établie');

      startRankUpdateScheduler();

      redisSubscriber.subscribe('discord-announcement', async (message) => {
        try {
          const channel = client.channels.cache.get(process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID!);
          if (channel?.isTextBased()) {
            await (channel as TextChannel).send(message);
            console.log('📢 Annonce Discord envoyée');
          }
        } catch (error) {
          console.error("Erreur lors de l'envoi de l'annonce Discord:", error);
        }
      });

      console.log('✅ Bot Discord initialisé avec succès');
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation du bot Discord:", error);
    }
  },
};

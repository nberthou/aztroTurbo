import { prismaClient } from '../utils';
import { getUserByTwitchId } from './twitch';
import { User } from '@prisma/client';

export function getUserByDiscordId(discordId?: string) {
  if (!discordId) {
    return null;
  }
  return prismaClient.user.findFirst({
    where: {
      discordId,
    },
  });
}

export function createDiscordUser(discordId: string) {
  return prismaClient.user.create({
    data: {
      discordId,
      stars: 1,
    },
  });
}

export async function mergeDiscordAndTwitchUser(discordId: string, twitchId: string) {
  await prismaClient.$transaction(async (tx) => {
    const twitchUser = await tx.user.findFirst({ where: { twitchId } });

    if (twitchUser) {
      const discordUser = await tx.user.findFirst({ where: { discordId } });

      if (!discordUser) {
        throw new Error(`Utilisateur Discord ${discordId} introuvable`);
      }

      await tx.user.updateMany({
        where: { discordId },
        data: {
          twitchId: twitchUser.twitchId,
          stars: twitchUser.stars + discordUser.stars,
        },
      });

      await tx.user.deleteMany({
        where: {
          AND: [{ twitchId }, { discordId: { not: discordId } }],
        },
      });
    } else {
      await tx.user.updateMany({
        where: { discordId },
        data: { twitchId },
      });
    }
  });
}

export async function getUsersRank(page: number): Promise<User[]> {
  const numberOfUsersToShow = 10;
  return await prismaClient.user.findMany({
    orderBy: { stars: 'desc' },
    take: numberOfUsersToShow,
    skip: page * numberOfUsersToShow,
  });
}

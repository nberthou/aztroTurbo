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
  const twitchUser = await getUserByTwitchId(twitchId);

  if (twitchUser) {
    const discordUser = await getUserByDiscordId(discordId);
    await prismaClient.user.updateMany({
      where: {
        discordId: discordId,
      },
      data: {
        twitchId: twitchUser.twitchId,
        stars: twitchUser.stars + discordUser!.stars,
      },
    });
    await prismaClient.user.deleteMany({
      where: {
        AND: [{ twitchId }, { discordId: { not: discordId } }],
      },
    });
  } else {
    await prismaClient.user.updateMany({
      where: { discordId },
      data: {
        twitchId,
      },
    });
  }
}

export async function getUsersRank(page: number): Promise<User[]> {
  const numberOfUsersToShow = 10;
  return await prismaClient.user.findMany({
    orderBy: { stars: 'desc' },
    take: numberOfUsersToShow,
    skip: page * numberOfUsersToShow,
  });
}

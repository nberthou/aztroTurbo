import { prismaClient } from '../utils';

export function getUserByTwitchId(twitchId?: string) {
  if (!twitchId) {
    return null;
  }
  return prismaClient.user.findFirst({
    where: {
      twitchId,
    },
  });
}

export function createTwitchUser(twitchId: string) {
  return prismaClient.user.create({
    data: {
      twitchId,
      stars: 1,
    },
  });
}

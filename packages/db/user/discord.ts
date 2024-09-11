import { prismaClient } from '../utils';

export function getUsers() {
  return prismaClient.user.findFirst().then((res) => res);
}

export function getUserByDiscordUsername(discordId?: string) {
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

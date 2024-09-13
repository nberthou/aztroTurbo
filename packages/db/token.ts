import { prismaClient } from './utils';

export async function getTokenByName(name: string) {
  return await prismaClient.twitchToken.findUnique({
    where: {
      name,
    },
  });
}

export async function upsertTokens(name: string, newTokenData: any) {
  return await prismaClient.twitchToken.upsert({
    where: { name },
    update: {
      accessToken: newTokenData.accessToken,
      refreshToken: newTokenData.refreshToken,
      obtainmentTimestamp: newTokenData.obtainmentTimestamp,
    },
    create: {
      name,
      accessToken: newTokenData.accessToken,
      refreshToken: newTokenData.refreshToken,
      obtainmentTimestamp: newTokenData.obtainmentTimestamp,
    },
  });
}

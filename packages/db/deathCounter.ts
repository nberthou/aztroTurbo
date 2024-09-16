import { prismaClient } from './utils';

export async function addDeathToCounter(name: string, amount: number) {
  return await prismaClient.deathCounter.update({
    where: {
      name,
    },
    data: {
      count: { increment: amount },
    },
  });
}

export async function getActiveGame() {
  return await prismaClient.deathCounter.findFirst({
    where: {
      active: true,
    },
  });
}

export async function setActiveGame(name: string) {
  await prismaClient.deathCounter.updateMany({
    where: { active: true },
    data: { active: false },
  });
  return await prismaClient.deathCounter.upsert({
    where: { name },
    create: {
      name,
      count: 0,
      active: true,
    },
    update: {
      active: true,
    },
  });
}

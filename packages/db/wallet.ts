import { prismaClient } from './utils';

export async function addStarsToWallet(userId: string, amount: number): Promise<void> {
  await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      stars: {
        increment: amount,
      },
      updatedAt: new Date(),
    },
  });
}

export async function getStarsFromWallet(userId: string): Promise<number> {
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
  });
  return user?.stars || 0;
}

export async function spendStarsFromWallet(userId: string, amount: number): Promise<void> {
  await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      stars: {
        decrement: amount,
      },
      updatedAt: new Date(),
    },
  });
}

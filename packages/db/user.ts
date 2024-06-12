import { prismaClient } from './utils';

export const getUsers = () => {
  return prismaClient.user.findFirst().then((res) => res);
};

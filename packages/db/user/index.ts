import { prismaClient } from '../utils';

export function getUsers() {
  return prismaClient.user.findMany();
}

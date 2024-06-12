import { prismaClient } from './utils';

export const getAllCommands = async () => {
  return await prismaClient.command.findMany();
};

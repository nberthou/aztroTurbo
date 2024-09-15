import { prismaClient } from './utils';

export async function getAllCommands() {
  return await prismaClient.command.findMany();
}

export async function createCommand(name: string, content: string) {
  return await prismaClient.command.create({
    data: {
      name,
      content,
    },
  });
}

export async function removeCommand(name: string) {
  return await prismaClient.command.delete({
    where: {
      name,
    },
  });
}

export async function editCommand(name: string, content: string) {
  return await prismaClient.command.update({
    where: {
      name,
    },
    data: {
      content,
    },
  });
}

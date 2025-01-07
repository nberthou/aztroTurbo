import { getAllCommands, createCommand, removeCommand, editCommand } from '@repo/db/command';
import { CommandProps } from '../handlers/message';
import { ChatClient } from '@twurple/chat';

export async function handleCommandsListCommand({
  message,
  prefix,
  isUserMod,
  chatClient,
  channel,
  displayName,
}: CommandProps): Promise<void> {
  const args = message.split(' ').slice(1);
  const dbCommandsList = await getAllCommands();

  if (args.length === 0) {
    await displayCommandList(chatClient, channel, displayName, prefix, dbCommandsList);
  } else if (isUserMod) {
    await handleModeratorCommands(chatClient, channel, prefix, args);
  } else {
    await chatClient.say(channel, `Désolé, seuls les modérateurs peuvent gérer les commandes.`);
  }
}

async function displayCommandList(
  chatClient: ChatClient,
  channel: string,
  displayName: string,
  prefix: string,
  dbCommandsList: any[]
): Promise<void> {
  const commandList = dbCommandsList.map((command) => `${prefix}${command.name}`).join(', ');
  await chatClient.say(channel, `@${displayName}, voici la liste des commandes disponibles : ${commandList}`);
}

async function handleModeratorCommands(chatClient: ChatClient, channel: string, prefix: string, args: string[]): Promise<void> {
  const [subCommand, commandName, ...contentArgs] = args;
  const commandContent = contentArgs.join(' ');

  switch (subCommand?.toLowerCase()) {
    case 'add':
      await handleAddCommand(chatClient, channel, prefix, commandName, commandContent);
      break;
    case 'remove':
      await handleRemoveCommand(chatClient, channel, prefix, commandName);
      break;
    case 'edit':
      await handleEditCommand(chatClient, channel, prefix, commandName, commandContent);
      break;
    default:
      await chatClient.say(channel, `Sous-commande non reconnue. Utilisez add, remove ou edit.`);
  }
}

async function handleAddCommand(
  chatClient: ChatClient,
  channel: string,
  prefix: string,
  commandName?: string,
  commandContent?: string
): Promise<void> {
  if (commandName && commandContent) {
    await createCommand(commandName.toLocaleLowerCase(), commandContent).then(async (data) => {
      await chatClient.say(channel, `La commande ${prefix}${data.name} a été ajoutée ! azgoldHF`);
    });
  } else {
    await chatClient.say(channel, `Usage: ${prefix}commands add <nom_commande> <contenu>`);
  }
}

async function handleRemoveCommand(chatClient: ChatClient, channel: string, prefix: string, commandName?: string): Promise<void> {
  if (commandName) {
    const commandRemoved = await removeCommand(commandName);
    await chatClient.say(channel, `La commande ${prefix}${commandRemoved.name} a été supprimée ! azgoldHF`);
  } else {
    await chatClient.say(channel, `Usage: ${prefix}commands remove <nom_commande>`);
  }
}

async function handleEditCommand(
  chatClient: ChatClient,
  channel: string,
  prefix: string,
  commandName?: string,
  commandContent?: string
): Promise<void> {
  if (commandName && commandContent) {
    await editCommand(commandName, commandContent);
    await chatClient.say(channel, `La commande ${prefix}${commandName} a été modifiée ! azgoldHF`);
  } else {
    await chatClient.say(channel, `Usage: ${prefix}commands edit <nom_commande> <nouveau_contenu>`);
  }
}

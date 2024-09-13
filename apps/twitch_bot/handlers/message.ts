import { ChatClient, ChatMessage } from '@twurple/chat';
import { getAllCommands } from '@repo/db/command';
import { UserService } from '@repo/user-service';
import { handleStarsCommand } from '../commands/stars';

const PREFIX = '!';
const BOT_NAME = 'bot_aztro';
const GREETING_COOLDOWN = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
const STARS_COOLDOWN = 3000; // 3 secondes en millisecondes

const customCommands: Record<string, Function> = {
  stars: handleStarsCommand,
};

export async function handleMessages(chatClient: ChatClient): Promise<void> {
  const dbCommands = await getAllCommands();

  chatClient.onMessage(async (channel, userName, message, chatMessage) => {
    const currentUser = await UserService.create(chatMessage.userInfo.userId, 'TWITCH');
    const { userInfo } = chatMessage;

    await Promise.all([
      handleCommand(chatClient, channel, message, userInfo.userId, userInfo.displayName, dbCommands),
      handleGreeting(chatClient, channel, userName, currentUser, chatMessage, message),
      handleFirstTimeChatter(chatClient, channel, chatMessage),
      addStars(currentUser, userInfo.isSubscriber),
    ]);
  });
}

async function handleCommand(
  chatClient: ChatClient,
  channel: string,
  message: string,
  userId: string,
  displayName: string,
  dbCommands: any[]
): Promise<void> {
  if (!message.toLowerCase().startsWith(PREFIX)) return;

  const [commandName, ...args] = message.slice(PREFIX.length).toLowerCase().split(' ');
  const dbCommand = dbCommands.find((cmd) => cmd.name.toLowerCase() === commandName);

  if (dbCommand) {
    await chatClient.say(channel, dbCommand.content);
  } else if (customCommands[commandName ?? '']) {
    await customCommands[commandName ?? '']!(userId, message, chatClient, displayName, channel);
  } else {
    await chatClient.say(channel, `Désolé, la commande ${commandName} n'existe pas.`);
  }
}

async function handleGreeting(
  chatClient: ChatClient,
  channel: string,
  userName: string,
  currentUser: UserService,
  chatMessage: ChatMessage,
  message: string
): Promise<void> {
  if (message.startsWith(PREFIX) || userName.toLowerCase() === BOT_NAME || chatMessage.isFirst) return;

  const timeSinceLastGreeting = Date.now() - currentUser.updatedAt.getTime();
  if (timeSinceLastGreeting > GREETING_COOLDOWN) {
    await chatClient.say(channel, `Bonjour ${chatMessage.userInfo.displayName} ! azgoldHi`);
  }
}

async function handleFirstTimeChatter(chatClient: ChatClient, channel: string, chatMessage: ChatMessage): Promise<void> {
  if (chatMessage.isFirst) {
    await chatClient.say(channel, `Bienvenue sur le stream d'Azgold, ${chatMessage.userInfo.displayName} ! azgoldHF`);
  }
}

async function addStars(currentUser: UserService, isSubscriber: boolean): Promise<void> {
  const timeSinceLastUpdate = Date.now() - currentUser.updatedAt.getTime();
  if (timeSinceLastUpdate > STARS_COOLDOWN) {
    await currentUser.wallet.addStars(isSubscriber ? 2 : 1);
  }
}

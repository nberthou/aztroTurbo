import { ChatClient, ChatMessage } from '@twurple/chat';
import { getAllCommands } from '@repo/db/command';
import { UserService } from '@repo/user-service';
import { handleStarsCommand } from '../commands/stars';
import { handleCommandsListCommand } from '../commands/commands';
import { handleCooldownCommand } from '../commands/cooldown';
import { handleDeathCounterCommand } from '../commands/deathCounter';
import { handleFollowageCommand } from '../commands/followage';
import { handleRouletteCommand } from '../commands/roulette';
import { handleShifumiCommand } from '../commands/shifumi';
import { handleAuCoinCommand } from '../commands/aucoin';
import { TwitchBot } from '../main';

export type CommandProps = {
  userId: string;
  message: string;
  chatClient: ChatClient;
  displayName: string;
  channel: string;
  prefix: string;
  isUserMod: boolean;
};

const PREFIX = '!';
const BOT_NAME = 'bot_aztro';
const GREETING_COOLDOWN = 24 * 60 * 60 * 1000;
const STARS_COOLDOWN = 3000;

const customCommands: Record<string, Function> = {
  stars: handleStarsCommand,
  commands: handleCommandsListCommand,
  cooldown: handleCooldownCommand,
  deathCounter: handleDeathCounterCommand,
  followage: handleFollowageCommand,
  roulette: handleRouletteCommand,
  shifumi: handleShifumiCommand,
  auCoin: handleAuCoinCommand,
};

export async function handleMessages(chatClient: ChatClient): Promise<void> {
  chatClient.onMessage(async (channel, userName, message, chatMessage) => {
    const dbCommands = await getAllCommands();
    const currentUser = await UserService.create(chatMessage.userInfo.userId, 'TWITCH');
    const { userInfo } = chatMessage;

    await Promise.all([
      handleCommand(
        chatClient,
        channel,
        message,
        userInfo.userId,
        userInfo.displayName,
        dbCommands,
        userInfo.isMod || userInfo.isBroadcaster
      ),
      handleGreeting(chatClient, channel, userName, currentUser, chatMessage, message),
      handleFirstTimeChatter(chatClient, channel, chatMessage),
      addStars(currentUser, userInfo.isSubscriber, message, userName),
    ]);
  });
}

async function handleCommand(
  chatClient: ChatClient,
  channel: string,
  message: string,
  userId: string,
  displayName: string,
  dbCommands: any[],
  isUserMod: boolean
): Promise<void> {
  if (!message.toLowerCase().startsWith(PREFIX)) return;

  const urlPattern =
    /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const urls = message.match(urlPattern);
  if (urls && !urls.some((url) => url.includes('clips.twitch.tv')) && !isUserMod) {
    await TwitchBot.bot.ban(channel, displayName.toLocaleLowerCase(), 'Les liens ne sont pas autorisés sur la chaîne.');
    return;
  }
  const [commandName, ...args] = message.slice(PREFIX.length).trim().toLowerCase().split(/\s+/);

  if (!commandName) {
    await chatClient.say(channel, `Il faut rentrer une commande après le !`);
    return;
  }

  const dbCommand = dbCommands.find((cmd) => cmd.name.toLowerCase() === commandName.toLowerCase());

  if (dbCommand) {
    await chatClient.say(channel, dbCommand.content);
  } else if (customCommands[commandName]) {
    try {
      await customCommands[commandName]({ userId, message, chatClient, displayName, channel, isUserMod, prefix: PREFIX });
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
      await chatClient.say(channel, `Désolé, une erreur s'est produite lors de l'exécution de la commande ${commandName}.`);
    }
  } else {
    await chatClient.say(channel, `Désolé, la commande ${PREFIX}${commandName} n'existe pas.`);
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

  const now = new Date();
  const userHasSpokenToday = currentUser.updatedAt > new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (!userHasSpokenToday || currentUser.wallet.stars < 1) {
    await chatClient.say(channel, `Bonjour ${chatMessage.userInfo.displayName} ! azgoldHi`);
  }
}

async function handleFirstTimeChatter(chatClient: ChatClient, channel: string, chatMessage: ChatMessage): Promise<void> {
  if (chatMessage.isFirst) {
    await chatClient.say(channel, `Bienvenue sur le stream d'Azgold, ${chatMessage.userInfo.displayName} ! azgoldHF`);
  }
}

async function addStars(currentUser: UserService, isSubscriber: boolean, message: string, username: string): Promise<void> {
  if (message.startsWith(PREFIX) || username.toLocaleLowerCase() === BOT_NAME) return;
  const timeSinceLastUpdate = Date.now() - currentUser.updatedAt.getTime();
  if (timeSinceLastUpdate > STARS_COOLDOWN) {
    await currentUser.wallet.addStars(isSubscriber ? 2 : 1);
  }
}

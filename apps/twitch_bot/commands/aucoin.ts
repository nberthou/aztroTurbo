import { TwitchBot } from '../main';
import type { CommandProps } from '../handlers/message';

export const handleAuCoinCommand = async ({ message, channel, chatClient, isUserMod }: CommandProps) => {
  if (!isUserMod) {
    return await chatClient.say(channel, "Tu n'as pas les droits pour mettre quelqu'un au coin ! azgoldAuCoin");
  }
  const [, userToTimeout, ..._] = message.split('');
  const userTo = userToTimeout!.replace('@', '');
  if (!userTo) {
    return await chatClient.say(channel, 'Il faut que tu spécifie un utilisateur à mettre au coin ! azgoldAuCoin');
  }
  const timeoutDuration = 30;
  const timeoutReason = "C'est vilain de se bash !";
  TwitchBot.bot.timeout(channel, userTo!, timeoutDuration, timeoutReason);
};

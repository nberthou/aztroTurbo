import { CommandProps } from '../handlers/message';
import { DeathCounter } from '@repo/death-counter';

export async function handleDeathCounterCommand({ chatClient, message, displayName, channel, isUserMod }: CommandProps) {
  const [, keyword, ...args] = message.split(' ');
  const deathCounter = await DeathCounter.create();
  switch (keyword) {
    case 'add':
      const numberToAdd = parseInt(args[0]!, 10);
      const amount = isNaN(numberToAdd) ? 1 : numberToAdd;
      if (!isUserMod) {
        chatClient.say(channel, `@${displayName}, tu n'as pas les droits nécéssaires pour effectuer cette action.`);
        return;
      }
      const updatedDeathCounter = await deathCounter?.addDeathToCounter(amount);
      chatClient.say(channel, `Azgold est mort ${updatedDeathCounter?.deathCount} fois sur ${updatedDeathCounter?.name} !`);
      break;
    case 'set':
      const gameName = args.join(' ');
      const newDeathCounter = await deathCounter?.setActiveGame(gameName);
      await chatClient.say(channel, `Le jeu a été actualisé, il s'agit désormais de ${newDeathCounter?.name}`);
      break;
  }
}

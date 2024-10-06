import type { CommandProps } from '../handlers/message';
import { UserService } from '@repo/user-service';
import { TwitchBot } from '../main';

export const handleRouletteCommand = async ({ userId, message, chatClient, displayName, channel }: CommandProps) => {
  const currentUser = await UserService.create(userId, 'TWITCH');
  const { wallet } = currentUser;

  const [, givenAmount] = message.split(' ');
  const amount = givenAmount === 'all' ? wallet.stars : parseInt(givenAmount!, 10);

  if (!amount || isNaN(amount)) {
    await chatClient.say(channel, `@${displayName}, le nombre que tu as spécifié est incorrect.`);
    return;
  }

  if (amount > wallet.stars) {
    await chatClient.say(channel, `@${displayName}, tu as misé plus d'étoiles que ce que tu possèdes actuellement...`);
    return;
  }

  const userHasWon = Math.random() > 0.5;
  userHasWon ? await wallet.addStars(amount) : await wallet.spendStars(amount);

  const winOrLose = userHasWon ? 'gagné' : 'perdu';
  const emoji = userHasWon ? 'azgoldStar' : 'azgoldSad';

  await chatClient.say(
    channel,
    `@${displayName}, tu as ${winOrLose} ${amount} étoile${amount > 1 ? 's' : ''} ! Tu as désormais ${wallet.stars} étoile${wallet.stars > 1 ? 's' : ''} ! ${emoji}`
  );
};

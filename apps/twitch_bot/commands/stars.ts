import { UserService } from '@repo/user-service';
import { TwitchBot } from '../main';
import { ChatClient } from '@twurple/chat';

export async function handleStarsCommand(
  userId: string,
  message: string,
  chatClient: ChatClient,
  displayName: string,
  channel: string
): Promise<void> {
  const currentUser = await UserService.create(userId, 'TWITCH');
  const { wallet } = currentUser;

  const [, keyword, ...args] = message.split(' ');

  switch (keyword?.toLowerCase()) {
    case 'give':
      await handleGiveStars(chatClient, channel, displayName, wallet, args);
      break;
    default:
      await displayStarsBalance(chatClient, channel, displayName, wallet.stars);
  }
}

async function handleGiveStars(
  chatClient: ChatClient,
  channel: string,
  displayName: string,
  wallet: any,
  args: string[]
): Promise<void> {
  if (args.length !== 2) {
    await chatClient.say(channel, 'Utilisation incorrecte. Exemple : !stars give Azgold 433');
    return;
  }

  const [targetUsername, amountString] = args;
  const cleanTargetUsername = targetUsername?.replace(/^@/, '').toLowerCase();
  const amountToGive = parseInt(amountString ?? '0', 10);

  if (isNaN(amountToGive) || amountToGive <= 0) {
    await chatClient.say(channel, 'Le montant doit être un nombre positif.');
    return;
  }

  if (amountToGive > wallet.stars) {
    await chatClient.say(channel, `Tu n'as pas assez d'étoiles. Tu as actuellement ${wallet.stars} étoiles.`);
    return;
  }

  const targetApiUser = await TwitchBot.apiClient.users.getUserByName(cleanTargetUsername ?? '');
  if (!targetApiUser) {
    await chatClient.say(channel, `L'utilisateur ${cleanTargetUsername} n'a pas été trouvé sur Twitch.`);
    return;
  }

  const targetUser = await UserService.create(targetApiUser.id, 'TWITCH');
  if (!targetUser) {
    await chatClient.say(channel, `L'utilisateur ${cleanTargetUsername} n'a pas été trouvé.`);
    return;
  }

  await wallet.spendStars(amountToGive);
  await targetUser.wallet.addStars(amountToGive);

  await chatClient.say(
    channel,
    `@${displayName}, tu as bien donné ${amountToGive} étoiles à @${targetApiUser.displayName} ! azgoldHF`
  );
}

async function displayStarsBalance(chatClient: ChatClient, channel: string, displayName: string, stars: number): Promise<void> {
  await chatClient.say(channel, `@${displayName}, tu as actuellement ${stars} étoile${stars > 1 ? 's' : ''} ! azgoldStar`);
}

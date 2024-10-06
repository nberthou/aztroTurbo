import { UserService } from '@repo/user-service';
import { CommandProps } from '../handlers/message';

export const handleShifumiCommand = async ({ channel, chatClient, message, userId, displayName }: CommandProps) => {
  const currentUser = await UserService.create(userId, 'TWITCH');
  const { wallet } = currentUser;

  const choices = ['pierre', 'feuille', 'ciseaux'];
  const [, userChoice, amount] = message.split(' ');
  const newAmount = amount === 'all' ? wallet.stars : parseInt(amount!, 10);
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];

  const WINNING_COMBINATIONS = {
    pierre: 'ciseaux',
    feuille: 'pierre',
    ciseaux: 'feuille',
  };

  const userHasWon = WINNING_COMBINATIONS[userChoice as keyof typeof WINNING_COMBINATIONS] === computerChoice;

  if (!wallet.stars || wallet.stars < 1) {
    return await chatClient.say(channel, "Tu n'as pas d'étoiles à miser.");
  }

  if (!choices.includes(userChoice ?? '')) {
    return await chatClient.say(channel, 'Tu dois choisir entre pierre, feuille ou ciseaux');
  }

  if (!newAmount || isNaN(newAmount)) {
    return await chatClient.say(channel, "Tu dois miser un nombre d'étoiles.");
  }

  if (newAmount > wallet.stars) {
    return await chatClient.say(channel, "Tu n'as pas assez d'étoiles pour miser autant.");
  }

  if (userChoice === computerChoice) {
    return await chatClient.say(
      channel,
      `@${displayName}, on a fait égalité ! Tu ne gagnes rien, et tu ne perds rien ! azgoldLUL`
    );
  }

  if (!userHasWon) {
    await wallet.spendStars(newAmount).then(async (res) => {
      await chatClient.say(
        channel,
        `@${displayName}, j'ai fait ${computerChoice}, tu as donc perdu ${newAmount} étoiles ! azgoldSad`
      );
    });
    return;
  }
  await wallet.addStars(newAmount * 1.5).then(async () => {
    await chatClient.say(
      channel,
      `@${displayName}, j'ai fait ${computerChoice}, tu as donc gagné ${newAmount * 1.5} étoiles ! azgoldHF`
    );
  });
};

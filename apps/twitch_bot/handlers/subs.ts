import { ChatClient } from '@twurple/chat';
import { UserService } from '@repo/user-service';

const giftCounts = new Map<string | undefined, number>();

export const handleCommunitySubs = (chatClient: ChatClient) => {
  chatClient.onCommunitySub(async (channel, user, subInfo) => {
    const previousCountGift = giftCounts.get(user) ?? 0;
    giftCounts.set(user, previousCountGift + subInfo.count);
    const currentUser = await UserService.create(subInfo.gifterUserId!, 'TWITCH');
    const { wallet } = currentUser;
    await wallet.addStars(200 * subInfo.count);
    await chatClient.say(
      channel,
      `Merci ${user} pour les ${subInfo.count} subgifts ! Prends ces ${200 * subInfo.count} étoiles en remerciements ! azgoldHF azgoldLove`
    );
  });
};

export const handleSubs = (chatClient: ChatClient) => {
  chatClient.onSub(async (channel, user, { userId }) => {
    const currentUser = await UserService.create(userId, 'TWITCH');
    const { wallet } = currentUser;

    await wallet.addStars(100);
    await chatClient.say(
      channel,
      `Merci pour le sub ${user}, bienvenue chez les Aztronautes ! Prends ces 100 étoiles en remerciements ! azgoldLove`
    );
  });
};

export const handleResubs = (chatClient: ChatClient) => {
  chatClient.onResub(async (channel, user, { months, displayName, userId }) => {
    const currentUser = await UserService.create(userId, 'TWITCH');
    const { wallet } = currentUser;
    await wallet.addStars(100 * months);
    await chatClient.say(
      channel,
      `Merci ${displayName} pour  le ${months}ème mois de sub ! Prends ces ${100 * months} en remerciements ! azgoldLove`
    );
  });
};

export const handleSubGifts = (chatClient: ChatClient) => {
  chatClient.onSubGift(async (channel, recipient, subInfo) => {
    const user = subInfo.gifterDisplayName;
    const previousCountGift = giftCounts.get(user) ?? 0;
    if (previousCountGift > 0) {
      giftCounts.set(user, previousCountGift - 1);
    } else {
      const currentUser = await UserService.create(subInfo.userId, 'TWITCH');
      const { wallet } = currentUser;

      await wallet.addStars(200);
      await chatClient.say(
        channel,
        `Merci ${user} pour le subgift à ${recipient} ! Prends ces 200 étoiles en remerciements ! azgoldLove`
      );
    }
  });
};

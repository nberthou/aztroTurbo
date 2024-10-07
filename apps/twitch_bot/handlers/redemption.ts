import { PubSubClient } from '@twurple/pubsub';
import { ChatClient } from '@twurple/chat';
import { UserService } from '@repo/user-service';

export const handleRedemptions = (pubSubClient: PubSubClient, chatClient: ChatClient, channelId: string, channelName: string) => {
  pubSubClient.onRedemption(channelId, async (msg) => {
    if (msg.rewardTitle.startsWith('Echanger')) {
      const currentUser = await UserService.create(msg.userId, 'TWITCH');
      const { wallet } = currentUser;

      await wallet.addStars(msg.rewardCost);
      await chatClient.say(channelName, `@${msg.userName}, tu as bien échangé ${msg.rewardCost} étoiles ! azgoldStar`);
    }
  });
};

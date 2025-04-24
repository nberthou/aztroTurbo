import { PubSubClient } from '@twurple/pubsub';
import { ChatClient } from '@twurple/chat';
import { UserService } from '@repo/user-service';
import { EventSubWsListener } from '@twurple/eventsub-ws';

export const handleRedemptions = (
  listener: EventSubWsListener,
  chatClient: ChatClient,
  channelId: string,
  channelName: string
) => {
  listener.onChannelRedemptionAdd(channelId, async (msg) => {
    if (msg.rewardTitle.startsWith('Echanger')) {
      const currentUser = await UserService.create(msg.userId, 'TWITCH');
      const { wallet } = currentUser;

      await wallet.addStars(msg.rewardCost);
      await chatClient.say(channelName, `@${msg.userName}, tu as bien échangé ${msg.rewardCost} étoiles ! azgoldStar`);
    }
  });
};

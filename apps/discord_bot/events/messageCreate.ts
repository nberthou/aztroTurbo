import { Events, Message, MessageInteraction } from 'discord.js';
import { Wallet } from '@repo/wallet';
import { UserService } from '@repo/user-service';

module.exports = {
  name: Events.MessageCreate,
  async execute(messageInteraction: Message) {
    const currentUser = await UserService.create(messageInteraction.author.id);
    // const fiveSecondsAgo = ;
    if (currentUser.updatedAt < new Date(Date.now() - 5000)) {
      await currentUser.wallet?.addStars(1);
    }
  },
};

import { Events, Message, MessageInteraction } from 'discord.js';

module.exports = {
  name: Events.MessageCreate,
  async execute(messageInteraction: Message) {
    console.debug('--------------------------------------------');
    console.debug('messageCreate.ts messageInteraction l.7', messageInteraction);
    console.debug('--------------------------------------------');
  },
};

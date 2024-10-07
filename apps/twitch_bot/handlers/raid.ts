import { ChatClient } from '@twurple/chat';

export const handleRaids = (chatClient: ChatClient) => {
  chatClient.onRaid(async (channel, user, raidInfo) => {
    await chatClient.say(
      channel,
      `${user} aborde notre Vaisseau avec ${raidInfo.viewerCount} membres d'équipage ! Bienvenue à toutes et à tous ! azgoldFusee azgoldFusee `
    );
  });
};

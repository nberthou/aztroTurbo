import { CommandProps } from '../handlers/message';
import { TwitchBot } from '../main';

export async function handleFollowageCommand({ channel, chatClient, displayName, userId }: CommandProps) {
  try {
    const {
      data: [follow],
    } = await TwitchBot.apiClient.channels.getChannelFollowers(process.env.TWITCH_CHANNEL_ID!, userId);

    if (follow) {
      const followDate = new Date(follow.followDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - followDate.getTime());

      const timeUnits = [
        { unit: 'an', value: Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365)), plural: 's' },
        { unit: 'mois', value: Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)), plural: '' },
        { unit: 'jour', value: Math.floor((diffTime % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)), plural: 's' },
        { unit: 'heure', value: Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), plural: 's' },
        { unit: 'minute', value: Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)), plural: 's' },
      ];

      const message = `${displayName} follow Azgold depuis ${timeUnits
        .filter(({ value }) => value > 0)
        .map(
          ({ unit, value, plural }, index, arr) =>
            `${value} ${unit}${value > 1 ? plural : ''}${index === arr.length - 1 ? '.' : index === arr.length - 2 ? ' et ' : ', '}`
        )
        .join('')}`;

      await chatClient.say(channel, message);
    } else {
      await chatClient.say(
        channel,
        `@${displayName}, tu ne follow pas Azgold... azgoldSad Pourquoi pas commencer maintenant ? azgoldHype`
      );
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du followage:', error);
    await chatClient.say(
      channel,
      `Désolé, une erreur s'est produite lors de la vérification du followage. Veuillez réessayer plus tard.`
    );
  }
}

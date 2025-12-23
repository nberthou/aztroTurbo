import { TwitchBot } from '../main';
import type { CommandProps } from '../handlers/message';

const GIVEAWAY_DURATION = 5 * 60 * 1000; // 5 minutes

let hasGiveawayRunning = false;
let giveawayParticipants: Set<string> = new Set();
let giveawayTimeout: NodeJS.Timeout | null = null;

export const handleGiveawayCommand = async ({ message, channel, chatClient, isUserMod, displayName }: CommandProps) => {
  const [, action] = message.split(' ');

  switch (action) {
    case 'start':
      if (!isUserMod) {
        return await chatClient.say(channel, "Tu n'as pas les droits pour démarrer un giveaway ! azgoldAucoin");
      }

      if (hasGiveawayRunning) {
        return await chatClient.say(channel, "Un giveaway est déjà en cours ! Restez à l'écoute pour participer !");
      }
      hasGiveawayRunning = true;

      await chatClient.say(
        channel,
        `Le giveaway a commencé ! Tapez "!giveaway join" pour participer ! Vous avez ${GIVEAWAY_DURATION / 60000} minutes ! azgoldHF`
      );

      giveawayTimeout = setTimeout(async () => {
        if (giveawayParticipants.size === 0) {
          await chatClient.say(channel, "Le giveaway est terminé, mais personne n'a participé... azgoldSad");
        } else {
          const participantsArray = Array.from(giveawayParticipants);
          const winnerIndex = Math.floor(Math.random() * participantsArray.length);
          const winner = participantsArray[winnerIndex];
          await chatClient.say(channel, `Félicitations à ${winner} qui remporte le giveaway ! azgoldDance`).then(() => {
            hasGiveawayRunning = false;
            giveawayParticipants.clear();
          });
        }
      }, GIVEAWAY_DURATION);
      break;

    case 'join':
      if (!hasGiveawayRunning) {
        return await chatClient.say(channel, "Il n'y a pas de giveaway en cours pour le moment. Restez à l'écoute ! azgoldSad");
      }

      if (giveawayParticipants.has(displayName)) {
        return await chatClient.say(channel, `${displayName}, tu es déjà inscrit(e) au giveaway ! azgoldDance`);
      }

      giveawayParticipants.add(displayName);
      await chatClient.say(channel, `${displayName}, tu es maintenant inscrit(e) au giveaway ! Bonne chance ! azgoldHF`);
      break;
  }
};

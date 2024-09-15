import { CommandProps } from '../handlers/message';

export async function handleCooldownCommand({ chatClient, channel }: CommandProps): Promise<void> {
  let count = 5;

  await chatClient.say(channel, `Début du compte à rebours de ${count} secondes...`);

  const interval = setInterval(() => {
    if (count > 0) {
      chatClient.say(channel, `${count}...`);
      count--;
    } else {
      chatClient.say(channel, 'GO !');
      clearInterval(interval);
    }
  }, 1000);
}

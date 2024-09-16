import { TokenManager } from './token_manager';
import { ChatClient } from '@twurple/chat';
import { PubSubClient } from '@twurple/pubsub';
import dotenv from 'dotenv';
import { handleMessages } from './handlers/message';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { DiscordBot } from 'discord_bot';

dotenv.config();

export class TwitchBot {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly channelId: string;
  private readonly channelName: string;
  public chatClient!: ChatClient;
  private pubSubClient!: PubSubClient;
  static apiClient: ApiClient;
  static listener: EventSubWsListener;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID ?? '';
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET ?? '';
    this.channelId = process.env.TWITCH_BOT_ID ?? '';
    this.channelName = process.env.TWITCH_CHANNEL_NAME ?? '';
  }

  private async initializeClients(): Promise<void> {
    const pubSubAuthProvider = new TokenManager('pubSub');
    const chatAuthProvider = new TokenManager('authProvider');

    await Promise.all([pubSubAuthProvider.initialize('pubSub'), chatAuthProvider.initialize('authProvider')]);

    this.chatClient = new ChatClient({
      authProvider: chatAuthProvider.getAuthProvider(),
      channels: [this.channelName],
    });

    this.pubSubClient = new PubSubClient({
      authProvider: pubSubAuthProvider.getAuthProvider(),
    });

    TwitchBot.apiClient = new ApiClient({ authProvider: chatAuthProvider.getAuthProvider() });
    TwitchBot.listener = new EventSubWsListener({ apiClient: TwitchBot.apiClient });
    try {
      console.log('token', await TwitchBot.apiClient.getTokenInfo());
      await TwitchBot.listener.start();
      console.log('EventSubWsListener démarré avec succès');
    } catch (error) {
      console.error('Erreur lors du démarrage de EventSubWsListener:', error);
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initializeClients();
      await handleMessages(this.chatClient);

      TwitchBot.listener.onStreamOnline(this.channelId, async (handler) => {
        try {
          const stream = await handler.getStream();
          const currentGame = stream?.gameName || 'un jeu inconnu';
          const message = `@everyone, le stream d'${handler.broadcasterDisplayName} sur ${currentGame} va commencer bientôt ! Venez nous rejoindre sur https://twitch.tv/${handler.broadcasterName} !`;

          await DiscordBot.sendMessageToAnnouncementsChannel(process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID!, message);
          await this.chatClient.say(
            this.channelName,
            `Bonjour à toutes et à tous, ce soir c'est ${currentGame} chez Azgold ! azgoldDance`
          );
        } catch (error) {
          console.error("Erreur lors de la gestion de l'événement onStreamOnline:", error);
        }
      });

      TwitchBot.listener.onStreamOffline(this.channelId, async () => {
        try {
          await this.chatClient.say(this.channelName, 'Le stream est terminé ! A bientôt pour un nouveau stream ! azgoldLove');
        } catch (error) {
          console.error("Erreur lors de la gestion de l'événement onStreamOffline:", error);
        }
      });
      this.chatClient.connect();
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }

    this.chatClient.onAuthenticationSuccess(() => console.log('BOT_Aztro est connecté à Twitch !'));
    this.chatClient.onAuthenticationFailure((error) => console.error('Erreur de connexion : ', error));
  }
}

(async () => {
  const bot = new TwitchBot();
  await bot.start();
})();

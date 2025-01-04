import { TokenManager } from './token_manager';
import { ChatClient } from '@twurple/chat';
import { PubSubClient } from '@twurple/pubsub';
import dotenv from 'dotenv';
import { handleMessages } from './handlers/message';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { DiscordBot } from 'discord_bot';
import { Bot } from '@twurple/easy-bot';
import { handleRedemptions } from './handlers/redemption';
import { handleCommunitySubs, handleResubs, handleSubGifts, handleSubs } from './handlers/subs';
import { handleRaids } from './handlers/raid';

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
  static bot: Bot;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID ?? '';
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET ?? '';
    this.channelId = process.env.TWITCH_CHANNEL_ID ?? '';
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
      await TwitchBot.listener.start();
      TwitchBot.bot = new Bot({
        channels: [this.channelName],
        authProvider: chatAuthProvider.getAuthProvider(),
      });
      console.log('EventSubWsListener démarré avec succès');
    } catch (error) {
      console.error('Erreur lors du démarrage de EventSubWsListener:', error);
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initializeClients();
      await handleMessages(this.chatClient);
      handleRedemptions(this.pubSubClient, this.chatClient, this.channelId, this.channelName);
      handleCommunitySubs(this.chatClient);
      handleSubs(this.chatClient);
      handleResubs(this.chatClient);
      handleSubGifts(this.chatClient);
      handleRaids(this.chatClient);

      TwitchBot.listener.onStreamOnline(this.channelId, async (handler) => {
        try {
          const stream = await handler.getStream();
          const currentGame = stream?.title.includes('[JUST CHILLING]') ? 'Just Chilling' : stream?.gameName || 'un jeu inconnu';
          const justChillingGuest =
            currentGame === 'Just Chilling' ? stream?.title.split(' ').find((word) => word.startsWith('@')) : null;

          let message: string;

          switch (currentGame) {
            case 'Just Chilling':
              message = `@everyone OMG c'est l'heure du Just Chilling avec ${justChillingGuest?.slice(1)} ! Viens sur le chat pour regarder leur discussion sur ${stream?.gameName} chez https://twitch.tv/${handler.broadcasterName} et https://twitch.tv/${justChillingGuest?.slice(1)} ! `;
            case 'Fall Guys':
              message = `@everyone, il est l'heure de faire des top 1 ! Rejoins ${handler.broadcasterDisplayName} et ses copains sur Fall Guys ici : https://twitch.tv/${handler.broadcasterName}`;
              break;
            case 'Stardew Valley':
              message = `@everyone, il est temps de retrouver ${handler.broadcasterDisplayName} à la ferme ! Rejoins-le sur Stardew Valley ici : https://twitch.tv/${handler.broadcasterName}`;
              break;
            case 'Animal Crossing':
              message = `@everyone, c'est le moment de retrouver ${handler.broadcasterDisplayName} sur son île ! C'est l'heure d'Animal Crossing, juste ici : https://twitch.tv/${handler.broadcasterName}`;

            default:
              message = `@everyone, le stream d'${handler.broadcasterDisplayName} sur ${currentGame} va bientôt commencer ! Venez nous rejoindre sur https://twitch.tv/${handler.broadcasterName} !`;
          }

          await DiscordBot.sendMessageToAnnouncementsChannel(process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID!, message);
          await this.chatClient.say(
            this.channelName,
            `Bonjour à toutes et à tous, ce soir c'est ${currentGame} chez ${handler.broadcasterDisplayName} ! azgoldDance`
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
    this.pubSubClient.onListenError((event, error, test) => {
      console.error('ERREUR PUBSUB', error);
    });
  }

  static async getLatestFollower(): Promise<string | undefined> {
    const channel = await TwitchBot.apiClient.users.getUserById(process.env.TWITCH_CHANNEL_ID!);
    const followers = (await channel?.getChannelFollowers())!.data.map((d) => d.userDisplayName);

    return followers[0];
  }
}

(async () => {
  const bot = new TwitchBot();
  await bot.start();
})();

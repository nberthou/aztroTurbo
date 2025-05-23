import { PrismaClient } from '@prisma/client';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { getTokenByName, upsertTokens } from '@repo/db/token';
import { TwitchBot } from './main';

const prisma = new PrismaClient();

export class TokenManager {
  private authProvider: RefreshingAuthProvider;
  private apiClient: ApiClient;
  private name: String;

  constructor(name: string) {
    this.authProvider = new RefreshingAuthProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    });

    this.authProvider.onRefresh((_, newTokenData) => this.onRefresh(name, newTokenData));

    this.apiClient = new ApiClient({ authProvider: this.authProvider });
    this.name = name;
  }

  public async initialize(name: string) {
    const tokens = await getTokenByName(name);
    if (tokens) {
      this.authProvider.addUser(process.env.TWITCH_CHANNEL_ID!, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 0,
        obtainmentTimestamp: tokens.obtainmentTimestamp,
        scope: tokens.scope as string[],
      });
      this.authProvider.addUser(
        process.env.TWITCH_BOT_ID!,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 0,
          obtainmentTimestamp: tokens.obtainmentTimestamp,
          scope: tokens.scope as string[],
        },
        ['chat']
      );
    }
  }

  private async onRefresh(
    name: string,
    newTokenData: {
      accessToken: string;
      refreshToken: string | null;
      expiresIn: number | null;
      obtainmentTimestamp: number;
    }
  ) {
    await upsertTokens(name, newTokenData);
  }

  getAuthProvider() {
    return this.authProvider;
  }

  getApiClient() {
    return this.apiClient;
  }
}

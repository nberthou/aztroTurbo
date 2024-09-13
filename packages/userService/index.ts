import { Wallet } from '@repo/wallet';
import { getUserByDiscordId, createDiscordUser } from '@repo/db/user/discord';
import { createTwitchUser, getUserByTwitchId } from '@repo/db/user/twitch';

export class UserService {
  public readonly platformId: string | null;
  public readonly platform: 'DISCORD' | 'TWITCH';
  public wallet: Wallet;
  public updatedAt: Date;
  public id: string;

  private constructor(platformId: string | null, platform: 'DISCORD' | 'TWITCH', id: string, wallet: Wallet, updatedAt: Date) {
    this.platformId = platformId;
    this.platform = platform;
    this.id = id;
    this.wallet = wallet;
    this.updatedAt = updatedAt;
  }

  public static async create(platformId: string | null, platform: 'DISCORD' | 'TWITCH'): Promise<UserService> {
    const dbUser = await UserService.initUser(platformId, platform);
    const wallet = await Wallet.create(dbUser.id);
    return new UserService(platformId, platform, dbUser.id, wallet, dbUser.updatedAt);
  }

  private static async initUser(platformId: string | null, platform: 'DISCORD' | 'TWITCH') {
    if (!platformId) {
      throw new Error("L'ID de la plateforme ne peut pas être null");
    }

    const getUser = platform === 'DISCORD' ? getUserByDiscordId : getUserByTwitchId;
    const createUser = platform === 'DISCORD' ? createDiscordUser : createTwitchUser;

    const dbUser = await getUser(platformId);
    return dbUser ?? (await createUser(platformId));
  }
}

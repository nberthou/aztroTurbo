import { Wallet } from '@repo/wallet';
import { WalletType } from '@repo/types';
import { getUserByDiscordUsername, createDiscordUser } from '@repo/db/user/discord';

export class UserService {
  public discordId?: string | null;
  public wallet: Wallet | null;
  public updatedAt: Date;
  public id: string;

  constructor(discordId?: string | null) {
    this.discordId = discordId;
    this.id = '';
    this.wallet = null;
    this.updatedAt = new Date();
  }

  public static async create(discordId: string | null) {
    const dbUser = await UserService.initUser(discordId);
    const user = new UserService(discordId);
    user.id = dbUser.id;
    user.wallet = new Wallet(dbUser.id);
    user.updatedAt = dbUser.updatedAt;
    return user;
  }

  private static async initUser(discordId: string | null) {
    let dbUser = await getUserByDiscordUsername(discordId ?? '');
    if (!dbUser) {
      return await createDiscordUser(discordId!);
    }
    return dbUser;
  }
}

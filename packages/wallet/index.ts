import { WalletType } from '@repo/types';
import { addStarsToWallet, spendStarsFromWallet, getStarsFromWallet } from '@repo/db/wallet';

export class Wallet {
  private userId: string;
  public stars: number;
  private walletType?: WalletType;

  constructor(userId: string, walletType: WalletType = WalletType.USER) {
    this.userId = userId;
    this.stars = 1;
    this.walletType = walletType;
  }

  public static async create(userId: string): Promise<Wallet> {
    const dbStars = await Wallet.initWallet(userId);
    const wallet = new Wallet(userId);
    wallet.stars = dbStars;
    return wallet;
  }

  private static async initWallet(userId: string) {
    return await getStarsFromWallet(userId);
  }

  public async addStars(amount: number): Promise<void> {
    await addStarsToWallet(this.userId, amount);
    this.stars += amount;
  }

  public async spendStars(amount: number): Promise<void> {
    if (amount > this.stars) {
      console.log('Not enough stars');
      return;
    }
    await spendStarsFromWallet(this.userId, amount);
    this.stars -= amount;
  }

  public getStars(): number {
    return this.stars;
  }
}

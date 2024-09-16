import { getActiveGame, addDeathToCounter as addDeathToDB } from '@repo/db/deathCounter';

export class DeathCounter {
  public name: string;
  public deathCount: number;
  public active: boolean;

  private constructor(name: string, deathCount: number, active: boolean) {
    this.name = name;
    this.deathCount = deathCount;
    this.active = active;
  }

  static async create(): Promise<DeathCounter | null> {
    const dbActiveCounter = await getActiveGame();
    return dbActiveCounter ? new DeathCounter(dbActiveCounter.name, dbActiveCounter.count, dbActiveCounter.active) : null;
  }

  public async addDeathToCounter(amount: number = 1): Promise<DeathCounter> {
    const updatedCounter = await addDeathToDB(this.name, amount);
    this.deathCount = updatedCounter.count;
    return this;
  }

  public async setActiveGame(name: string): Promise<DeathCounter> {
    const updatedCounter = await this.setActiveGame(name);
    this.name = updatedCounter.name;
    this.active = updatedCounter.active;
    this.deathCount = updatedCounter.deathCount;
    return this;
  }
}

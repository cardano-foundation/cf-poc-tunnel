import { randomPasscode, ready, SignifyClient, Tier } from 'signify-ts';

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL = import.meta.env.VITE_KERIA_URL;
  static readonly KERIA_BOOT_ENDPOINT = import.meta.env
    .VITE_KERIA_BOOT_ENDPOINT;
  static readonly SIGNIFY_BRAN_STORAGE_KEY = 'SIGNIFY_BRAN';

  constructor() {
    this.started = false;
  }
  async start(): Promise<void> {
    await ready();
    const bran = await this.getBran();

    this.signifyClient = new SignifyClient(
      SignifyApi.KERIA_URL as string,
      bran,
      Tier.low,
      SignifyApi.KERIA_BOOT_ENDPOINT,
    );

    try {
      await this.signifyClient.connect();
      this.started = true;
    } catch (err) {
      await this.signifyClient.boot();
      await this.signifyClient.connect();
      this.started = true;
    }
  }
  private async getBran(): Promise<string> {
    const bran = await chrome.storage.local.get([
      SignifyApi.SIGNIFY_BRAN_STORAGE_KEY,
    ]);

    if (bran[SignifyApi.SIGNIFY_BRAN_STORAGE_KEY] === undefined) {
      const newBran = randomPasscode();
      await chrome.storage.local.set({
        [SignifyApi.SIGNIFY_BRAN_STORAGE_KEY]: newBran,
      });
      return newBran;
    } else {
      return bran[SignifyApi.SIGNIFY_BRAN_STORAGE_KEY] as string;
    }
  }

  createIdentifier = async (name: string) => {
    return await this.signifyClient.identifiers().create(name);
  };

  getIdentifierByName = async (name: string) => {
    return await this.signifyClient.identifiers().get(name);
  };

  resolveOOBI = async (url: string) => {
    const oobiOperation = await this.signifyClient.oobis().resolve(url);
    return await this.waitAndGetDoneOp(oobiOperation, 15000, 250);
  };

  private waitAndGetDoneOp = async (
      op: any,
      timeout: number,
      interval: number,
  ) => {
    const startTime = new Date().getTime();
    while (!op.done && new Date().getTime() < startTime + timeout) {
      op = await this.signifyClient.operations().get(op.name);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return op;
  };

}

export { SignifyApi };

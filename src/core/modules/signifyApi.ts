import { randomPasscode, ready, SignifyClient, Tier } from 'signify-ts';
import { Logger } from '@src/utils/logger';
import { Aid } from '@src/core/modules/signifyApi.types';

const logger = new Logger();

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL = import.meta.env.VITE_KERIA_URL;
  static readonly KERIA_BOOT_URL = import.meta.env.VITE_KERIA_BOOT_ENDPOINT;
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
      SignifyApi.KERIA_BOOT_URL,
    );

    try {
      await this.signifyClient.connect();
      this.started = true;
      logger.addLog(
        `✅ Signify initialized with Keria endpoint: ${SignifyApi.KERIA_URL}`,
      );
    } catch (err) {
      await this.signifyClient.boot();
      logger.addLog(
        `✅ Signify booted with Keria endpoint: ${SignifyApi.KERIA_BOOT_URL}`,
      );
      try {
        await this.signifyClient.connect();
        this.started = true;
        logger.addLog(
          `✅ Signify initialized with Keria endpoint: ${SignifyApi.KERIA_URL}`,
        );
      } catch (e) {
        logger.addLog(
          `❌ Init Signify failed with endpoint: ${SignifyApi.KERIA_URL}`,
          true,
        );
      }
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
    const aid = await this.signifyClient.identifiers().create(name);
    logger.addLog(`✅ AID created with name: ${name}`);
    return aid;
  };

  getIdentifierByName = async (name: string) => {
    return await this.signifyClient.identifiers().get(name);
  };

  resolveOOBI = async (url: string) => {
    try {
      if (!this.started) return;

      const oobiOperation = await this.signifyClient.oobis().resolve(url);
      const r = await this.waitAndGetDoneOp(oobiOperation, 15000, 250);
      if (r.done) {
        logger.addLog(
          `✅ OOBI resolved successfully for URL: ${url}. \nResponse from Keria: ${JSON.stringify(
            r,
          )}`,
        );
      } else {
        logger.addLog(
          `❌ Resolving OOBI failed for URL: ${url}. \nResponse from Keria: ${JSON.stringify(
            r,
          )}`,
          true,
        );
      }
      return r;
    } catch (e) {
      logger.addLog(
        `❌ Resolving OOBI failed for URL: ${url}. \nError: ${e}`,
        true,
      );
    }
  };

  getSigner = async (aid: Aid) => {
    return await this.signifyClient.manager?.get(aid);
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

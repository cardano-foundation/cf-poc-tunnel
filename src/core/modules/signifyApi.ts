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
      await logger.addLog(
        `✅ Signify initialized with Keria endpoint: ${SignifyApi.KERIA_URL}`,
      );
    } catch (err) {
      await this.signifyClient.boot();
      await logger.addLog(
        `✅ Signify booted with Keria endpoint: ${SignifyApi.KERIA_BOOT_URL}`,
      );
      try {
        await this.signifyClient.connect();
        this.started = true;
        await logger.addLog(
          `✅ Signify initialized with Keria endpoint: ${SignifyApi.KERIA_URL}`,
        );
      } catch (e) {
        await logger.addLog(
          `❌ Init Signify failed with Keria endpoint: ${SignifyApi.KERIA_URL}. Error: ${e}`,
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
    try {
      const aid = await this.signifyClient.identifiers().create(name);
      await logger.addLog(`✅ AID created with name: ${name}`);
      return {
        success: true,
        data: aid,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  };

  getIdentifierByName = async (name: string) => {
    try {
      return {
        success: true,
        data: await this.signifyClient.identifiers().get(name),
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  };

  resolveOOBI = async (url: string) => {
    try {
      if (!this.started)
        return {
          success: false,
          error: 'Signify not initialized',
        };

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
      return {
        success: true,
        data: r,
      };
    } catch (e) {
      logger.addLog(
        `❌ Resolving OOBI failed for URL: ${url}. \nError: ${e}`,
        true,
      );
      return {
        success: false,
        error: e,
      };
    }
  };

  getSigner = async (aid: Aid) => {
    try {
      return {
        success: true,
        data: await this.signifyClient.manager?.get(aid),
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
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

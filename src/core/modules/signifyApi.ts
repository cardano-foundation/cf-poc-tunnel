import { randomPasscode, ready, SignifyClient, Tier } from "signify-ts";
import { Aid, ResponseData } from "@src/core/modules/signifyApi.types";
import { EventResult } from "signify-ts/src/keri/app/aiding";

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL = import.meta.env.VITE_KERIA_URL;
  static readonly KERIA_BOOT_URL = import.meta.env.VITE_KERIA_BOOT_ENDPOINT;
  static readonly SIGNIFY_BRAN_STORAGE_KEY = "SIGNIFY_BRAN";
  static readonly ENTERPRISE_SCHEMA_SAID =
    "EGjD1gCLi9ecZSZp9zevkgZGyEX_MbOdmhBFt4o0wvdb";
  static readonly ENTERPRISE_PREFIX =
    "ECsjFzeEvQFhFL2IivLjwuVj-Gp2O6qbPyivlmmWOpBy";

  constructor() {
    this.started = false;
  }
  async start(): Promise<ResponseData<undefined>> {
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
      return {
        success: true,
      };
    } catch (err) {
      await this.signifyClient.boot();
      try {
        await this.signifyClient.connect();
        this.started = true;
        return {
          success: true,
        };
      } catch (e) {
        return {
          success: false,
          error: new Error(
            `Init Signify failed with Keria endpoint: ${SignifyApi.KERIA_URL}. Error: ${e}`,
          ),
        };
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

  createIdentifier = async (
    name: string,
  ): Promise<ResponseData<EventResult | any>> => {
    try {
      const op: any = await this.signifyClient.identifiers().create(name);
      await op.op();
      await this.signifyClient
        .identifiers()
        .addEndRole(name, "agent", this.signifyClient.agent!.pre);
      const aid = await this.getIdentifierByName(name);
      return {
        success: true,
        data: aid,
      };
    } catch (e) {
      return {
        success: false,
        error: new Error(
          `Error on AID creation with name ${name}. Error: ${e}`,
        ),
      };
    }
  };

  getIdentifierByName = async (name: string): Promise<ResponseData<any>> => {
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

  resolveOOBI = async (url: string): Promise<ResponseData<any>> => {
    try {
      if (!this.started)
        return {
          success: false,
          error: new Error("Signify not initialized"),
        };

      const oobiOperation = await this.signifyClient.oobis().resolve(url);
      const r = await this.waitAndGetDoneOp(oobiOperation, 15000, 250);
      if (r.done) {
        return {
          success: true,
          data: r,
        };
      } else {
        return {
          success: false,
          error: new Error(
            `Resolving OOBI failed for URL: ${url}. \nResponse from Keria: ${JSON.stringify(
              r,
            )}`,
          ),
        };
      }
    } catch (e) {
      return {
        success: false,
        error: new Error(
          `Resolving OOBI failed for URL: ${url}. \nError: ${e}`,
        ),
      };
    }
  };

  getSigner = async (aid: Aid): Promise<ResponseData<any>> => {
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
  getCredentials = async (): Promise<ResponseData<any>> => {
    try {
      return {
        success: true,
        data: await this.signifyClient.credentials().list(),
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  };

  async getNotifications() {
    const noty = await this.signifyClient.notifications().list();
    try {
      return {
        success: true,
        data: noty,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  }
  async getOOBI(name: string, role) {
    const oobi = await this.signifyClient.oobis().get(name, role);
    try {
      return {
        success: true,
        data: oobi,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  }

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

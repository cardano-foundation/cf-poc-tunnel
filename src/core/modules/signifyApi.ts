import {
  Encrypter,
  Verfer,
  Operation,
  randomPasscode,
  ready,
  SignifyClient,
  Tier,
  EventResult,
} from "signify-ts";
import { Aid } from "@src/core/modules/signifyApi.types";
import { ResponseData } from "@src/core/background/types";
import { failure, success } from "@src/utils";

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL = import.meta.env.VITE_KERIA_URL;
  static readonly KERIA_BOOT_URL = import.meta.env.VITE_KERIA_BOOT_ENDPOINT;
  static readonly SIGNIFY_BRAN_STORAGE_KEY = "SIGNIFY_BRAN";

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
      return success(undefined);
    } catch (err) {
      await this.signifyClient.boot();
      try {
        await this.signifyClient.connect();
        this.started = true;
        return success(undefined);
      } catch (e) {
        return failure(e);
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

  async createIdentifier(name: string): Promise<ResponseData<EventResult>> {
    try {
      const op = await this.signifyClient.identifiers().create(name);
      await op.op();
      await (
        await this.signifyClient
          .identifiers()
          .addEndRole(name, "agent", this.signifyClient.agent!.pre)
      ).op();
      return success(op);
    } catch (e) {
      return failure(e);
    }
  }

  async getIdentifierByName(name: string): Promise<ResponseData<Aid>> {
    try {
      return success(await this.signifyClient.identifiers().get(name));
    } catch (e) {
      return failure(e);
    }
  }

  async createOOBI(name: string): Promise<ResponseData<any>> {
    try {
      return success(await this.signifyClient.oobis().get(name, "agent"));
    } catch (e) {
      return failure(e);
    }
  }

  async resolveOOBI(url: string): Promise<ResponseData<any>> {
    try {
      if (!this.started) {
        return failure(new Error("Signify not initialized"));
      }

      const oobiOperation = await this.signifyClient.oobis().resolve(url);
      const r = await this.waitAndGetDoneOp(oobiOperation, 15000, 250);
      if (r.done) {
        return success(r);
      } else {
        return failure(
          new Error(
            `Resolving OOBI failed for URL: ${url}. \nResponse from Keria: ${JSON.stringify(
              r,
            )}`,
          ),
        );
      }
    } catch (e) {
      return failure(
        new Error(`Resolving OOBI failed for URL: ${url}. \nError: ${e}`),
      );
    }
  }

  async getKeyManager(aid: Aid): Promise<ResponseData<any>> {
    try {
      return success(await this.signifyClient.manager?.get(aid));
    } catch (e) {
      return failure(e);
    }
  }

  async getRemoteEncrypter(aid: string): Promise<ResponseData<Encrypter>> {
    try {
      const pubKey = (await this.signifyClient.keyStates().get(aid))[0].k[0];
      return success(new Encrypter({}, new Verfer({ qb64: pubKey }).qb64b));
    } catch (e) {
      return failure(e);
    }
  }

  async getRemoveVerfer(aid: string): Promise<ResponseData<Verfer>> {
    try {
      const pubKey = (await this.signifyClient.keyStates().get(aid))[0].k[0];
      return success(new Verfer({ qb64: pubKey }));
    } catch (e) {
      return failure(e);
    }
  }

  private async waitAndGetDoneOp(
    op: Operation,
    timeout: number,
    interval: number,
  ): Promise<Operation> {
    const startTime = new Date().getTime();
    while (!op.done && new Date().getTime() < startTime + timeout) {
      op = await this.signifyClient.operations().get(op.name);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return op;
  }
}

export { SignifyApi };

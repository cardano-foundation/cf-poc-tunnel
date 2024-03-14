import {
  Encrypter,
  Verfer,
  Operation,
  randomPasscode,
  ready,
  SignifyClient,
  Tier,
  EventResult,
  Dict,
} from "signify-ts";
import { Aid } from "@src/core/modules/signifyApi.types";
import { ResponseData } from "@src/core/background/types";
import { failure, success } from "@src/utils";

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL = import.meta.env.VITE_KERIA_URL;
  static readonly KERIA_BOOT_URL = import.meta.env.VITE_KERIA_BOOT_ENDPOINT;

  constructor() {
    this.started = false;
  }

  async start(): Promise<ResponseData<undefined>> {
    if (this.started) {
      return success(undefined);
    }

    await ready();

    this.signifyClient = new SignifyClient(
      SignifyApi.KERIA_URL as string,
      randomPasscode(),
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
      await this.start();
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
      await this.start();

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

  async getNotifications(): Promise<
    ResponseData<{
      start: number;
      end: number;
      total: number;
      notes: any[];
    }>
  > {
    try {
      return success(await this.signifyClient.notifications().list());
    } catch (e) {
      return failure(e);
    }
  }

  async getUnreadNotifications(): Promise<
    ResponseData<{
      notes: any[];
    }>
  > {
    try {
      const notes = (await this.signifyClient.notifications().list()).notes;
      return success({
        notes: notes.filter(
          (note: any) => note.r === false && note.a.r === "/exn/ipex/grant",
        ),
      });
    } catch (e) {
      return failure(e);
    }
  }
  async markNotificationAsRead(noteId: string): Promise<ResponseData<void>> {
    try {
      await this.signifyClient.notifications().mark(noteId);
      return success(undefined);
    } catch (e) {
      return failure(e);
    }
  }

  async getExchangeMessage(notificationD: string): Promise<any> {
    try {
      return success(await this.signifyClient.exchanges().get(notificationD));
    } catch (e) {
      return failure(e);
    }
  }

  async admitIpex(
    said: string,
    aidName: string,
    issuerAid: string,
  ): Promise<ResponseData<any>> {
    try {
      const dt = new Date().toISOString().replace("Z", "000+00:00");
      const [admit, sigs, aend] = await this.signifyClient
        .ipex()
        .admit(aidName, "", said, dt);
      const submitAdmitResponse = await this.signifyClient
        .ipex()
        .submitAdmit(aidName, admit, sigs, aend, [issuerAid]);
      return success(submitAdmitResponse);
    } catch (e) {
      return failure(e);
    }
  }

  async getKeyManager(aid: Aid): Promise<ResponseData<any>> {
    try {
      return success(await this.signifyClient.manager?.get(aid));
    } catch (e) {
      return failure(e);
    }
  }

  async sendMessage(
    name: string,
    recipient: string,
    payload: Dict<any>,
  ): Promise<ResponseData<any>> {
    const aidResult = await this.getIdentifierByName(name);
    if (!aidResult.success) {
      return failure(new Error(`Error trying to get the AID by name: ${name}`));
    }

    try {
      const route = "/tunnel/wallet/request";

      const messageSent = await this.signifyClient
        .exchanges()
        .send(name, "tunnel", aidResult.data, route, payload, {}, [recipient]);
      return success(messageSent);
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

const signifyApiInstance = new SignifyApi();
export { signifyApiInstance };

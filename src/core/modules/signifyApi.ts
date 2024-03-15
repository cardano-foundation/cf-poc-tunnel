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
import {LocalStorageKeys} from "@src/core/background";

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL = import.meta.env.VITE_KERIA_URL;
  static readonly KERIA_BOOT_URL = import.meta.env.VITE_KERIA_BOOT_ENDPOINT;

  constructor() {
    this.started = false;
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    await ready();
    console.info(`Initialising Signify client...`);
    let bran;
    try {

     bran = (await chrome.storage.local.get([LocalStorageKeys.BRAN]))?.bran;
      console.info(`Using existing bran...`);
    } catch (e) { /* pass*/ }
    if (!bran){
      bran = randomPasscode();
      // TODO: Storing bran in local just for demo purpose
      await chrome.storage.local.set({ [LocalStorageKeys.BRAN]: bran });
      console.info(`Using new bran...`);
    }

    this.signifyClient = new SignifyClient(
      SignifyApi.KERIA_URL as string,
      bran,
      Tier.low,
      SignifyApi.KERIA_BOOT_URL,
    );

    // No point try catching as cannot use the extension without KERIA booted.
    await this.signifyClient.boot();
    await this.signifyClient.connect();
    this.started = true;
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

  async getIdentifiers(): Promise<ResponseData<any>> {
    try {
      await this.start();
      return success(await this.signifyClient.identifiers());
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

  async getUnreadIpexGrants(): Promise<
    ResponseData<{
      notes: any[];
    }>
  > {
    return this.getUnreadRouteNotifications("/exn/ipex/grant");
  }

  private async getUnreadPongs(): Promise<
    ResponseData<{
      notes: any[];
    }>
  > {
    return this.getUnreadRouteNotifications("/tunnel/pong");
  }

  private async getUnreadRouteNotifications(route: string): Promise<ResponseData<{ notes: any[] }>> {
    try {
      const notes = (await this.signifyClient.notifications().list()).notes;
      return success({
        notes: notes.filter(
          (note: any) => note.r === false && note.a.r === route,
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

  async sendTunnelRequest(
    name: string,
    recipient: string,
    payload: Dict<any>,
  ): Promise<ResponseData<any>> {
    const aids = await this.getIdentifiers();
    const aidResult = await this.getIdentifierByName(name);
    if (!aidResult.success) {
      return failure(
        new Error(`[TunnelRequest] Error trying to get the AID by name: ${name}, trace: ${aidResult.error}`),
      );
    }

    try {
      const route = "/tunnel/wallet/request";

      const messageSent = await this.signifyClient
        .exchanges()
        .send(name, "tunnel", aidResult.data, route, payload, {}, [
          recipient,
        ]);
      return success(messageSent);
    } catch (e) {
      return failure(e);
    }
  }

  async sendPing(name: string, recipient: string, pongCallback: () => void): Promise<ResponseData<any>> {
    const aidResult = await this.getIdentifierByName(name);
    if (!aidResult.success) {
      return failure(
        new Error(`[Ping] Error trying to get the AID by name: ${name}, trace: ${aidResult.error}`),
      );
    }

    try {
      const messageSent = await this.signifyClient
        .exchanges()
        .send(name, "tunnel", aidResult.data, "/tunnel/ping", {
          to: recipient
        }, {}, [
          recipient,
        ]);
      this.setupPongCallback(recipient, pongCallback);
      return success(messageSent);
    } catch (e) {
      return failure(e);
    }
  }

  private async setupPongCallback(from: string, callback: () => void): Promise<void> {
    while (true) {
      const getPongsResult = await this.getUnreadPongs();
      if (!getPongsResult.success) {
        console.warn("Failed to fetch /tunnel/pong notifications");
        continue;
      }

      for (const note of getPongsResult.data.notes) {
        const getExnResult = await this.getExchangeMessage(note.a.d);
        if (!getExnResult.success) {
          console.warn(`Received notification with SAID ${note.a.d}, but the exn message was not found`);
          continue;
        }
        if (getExnResult.data.exn?.i === from) {
          callback();
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
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

const signifyApiInstance  = new SignifyApi();
export { signifyApiInstance };

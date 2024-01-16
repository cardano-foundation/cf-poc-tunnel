import { SignifyClient, ready, Tier, randomPasscode } from 'signify-ts';

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started: boolean;
  static readonly KERIA_URL: string = 'http://192.168.0.66:3901';
  static readonly KERIA_BOOT_ENDPOINT = 'http://192.168.0.66:3903';
  static readonly SIGNIFY_BRAN_STORAGE_KEY = 'SIGNIFY_BRAN';

  constructor() {
    this.started = false;
  }
  async start(): Promise<void> {
    await ready();
    const bran = await this.getBran();

    console.log('bran from storage');
    console.log(bran);

    this.signifyClient = new SignifyClient(
      SignifyApi.KERIA_URL,
      bran,
      Tier.low,
      SignifyApi.KERIA_BOOT_ENDPOINT,
    );

    console.log('signifyClient initialized');
    console.log(this.signifyClient);
    try {
      await this.signifyClient.connect();
      this.started = true;
    } catch (err) {
      console.log('err');
      console.log(err);
      await this.signifyClient.boot();
      console.log('after boot, lets try to connect');
      await this.signifyClient.connect();
      this.started = true;
      console.log('hey connected!');
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
}

export { SignifyApi };

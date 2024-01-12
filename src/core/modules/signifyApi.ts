import { SignifyClient, ready as signifyReady, Tier, randomPasscode } from 'signify-ts';

class SignifyApi {
  private signifyClient!: SignifyClient;
  public started:boolean;
  static readonly KERIA_URL: string =
    'https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org';
  static readonly KERIA_BOOT_ENDPOINT =
    'https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org';
  static readonly SIGNIFY_BRAN_STORAGE_KEY =
    'SIGNIFY_BRAN';

  constructor() {
    this.started = false;
  }
  async start(): Promise<void> {
    console.log("lets start")
    await signifyReady();

    console.log("signify is ready")
    const bran = await this.getBran();
    this.signifyClient = new SignifyClient(
      SignifyApi.KERIA_URL,
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
    }
  }
  private async getBran(): Promise<string> {

    const bran = await chrome.storage.local.get([SignifyApi.SIGNIFY_BRAN_STORAGE_KEY]);

    console.log("bran from storage");
    console.log(bran[SignifyApi.SIGNIFY_BRAN_STORAGE_KEY]);

    if (bran[SignifyApi.SIGNIFY_BRAN_STORAGE_KEY] === undefined){
        const newBran = randomPasscode();
        await chrome.storage.local.set({ [SignifyApi.SIGNIFY_BRAN_STORAGE_KEY]: newBran });
        return newBran;
    } else {
        return bran[SignifyApi.SIGNIFY_BRAN_STORAGE_KEY] as string;
    }
  }
}

export { SignifyApi };

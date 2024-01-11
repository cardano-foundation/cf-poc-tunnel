import { SignifyClient, ready as signifyReady, Tier, randomPasscode } from 'signify-ts';

class SignifyApi {
  private signifyClient: SignifyClient;
  static readonly KERIA_URL: string =
    'https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org';
  static readonly KERIA_BOOT_ENDPOINT =
    'https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org';
  static readonly SIGNIFY_BRAN_STORAGE_KEY =
    'SIGNIFY_BRAN';

  async start(): Promise<void> {
    await signifyReady();
    const bran = await this.getBran();
    this.signifyClient = new SignifyClient(
      SignifyApi.KERIA_URL,
      bran,
      Tier.low,
      SignifyApi.KERIA_BOOT_ENDPOINT,
    );
    try {
      await this.signifyClient.connect();
    } catch (err) {
      await this.signifyClient.boot();
      await this.signifyClient.connect();
    }
  }
  private async getBran(): Promise<string> {

    const bran = await chrome.storage.local.get([SignifyApi.SIGNIFY_BRAN_STORAGE_KEY]);

    console.log("bran");
    console.log(bran);
    if (!bran){
        const newBran = randomPasscode();
        await chrome.storage.local.set({ [SignifyApi.SIGNIFY_BRAN_STORAGE_KEY]: newBran });
        return newBran;
    } else {
        return bran[SignifyApi.SIGNIFY_BRAN_STORAGE_KEY] as string;
    }
  }
}

export { SignifyApi };

import { Cipher, Matter, MtrDex, b } from "signify-ts";
import { config } from "./src/config";
import {
  getIdentifierByName,
  getKeyManager,
  getRemoteEncrypter,
  initSignify,
} from "./src/services/signifyService";

async function run() {
  const client = await initSignify();

  const serverAid = await getIdentifierByName(config.signifyName);
  const ourAid = await getIdentifierByName("test-aid");

  const keyManager = await getKeyManager(ourAid);
  const encrypter = await getRemoteEncrypter(serverAid.prefix);

  const toEncrypt: Uint8Array = Buffer.from(
    JSON.stringify({
      src: ourAid.prefix,
      data: {
        inner: "some data!!",
      },
    }),
  );
  const cipher: Cipher = encrypter.encrypt(
    null,
    new Matter({ raw: toEncrypt, code: LEAD_CODES.get(toEncrypt.length % 3) }),
  );

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const resp = await client.signedFetch(
    "http://localhost:3001",
    "/ping",
    "POST",
    {
      sig: keyManager.signers[0].sign(
        b(
          JSON.stringify({
            src: ourAid.prefix,
            dest: serverAid.prefix,
            datetime,
            cipher: cipher.qb64,
          }),
        ),
      ).qb64,
      cipher: cipher.qb64,
    },
    "test-aid",
    datetime,
  );
  resp.headers.forEach(function (val, key) {
    console.log(key + " -> " + val);
  });
  if (resp.ok) {
    console.log(await resp.json());
  } else {
    console.log(await resp.text());
  }
}

run();

const LEAD_CODES = new Map<number, string>([
  [0, MtrDex.StrB64_L0],
  [1, MtrDex.StrB64_L1],
  [2, MtrDex.StrB64_L2],
]);

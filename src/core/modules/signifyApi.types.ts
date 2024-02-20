import { MtrDex } from "signify-ts";

interface Aid {
  name: string;
  prefix: string;
  salty: any;
  transferable: boolean;
  state: {
    vn: number[];
    i: string;
    s: string;
    p: string;
    d: string;
    f: string;
    dt: string;
    et: string;
    kt: string;
    k: string[];
    nt: string;
    n: string[];
    bt: string;
    b: string[];
    c: string[];
    ee: {
      s: string;
      d: string;
      br: any[];
      ba: any[];
    };
    di: string;
  };
  windexes: number[];
}

const LEAD_CODES = new Map<number, string>([
  [0, MtrDex.StrB64_L0],
  [1, MtrDex.StrB64_L1],
  [2, MtrDex.StrB64_L2],
]);

export { Aid, LEAD_CODES };

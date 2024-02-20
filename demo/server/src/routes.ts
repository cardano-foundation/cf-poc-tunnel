import express from "express";
import { config } from "./config";
import { ping } from "./apis/ping.api";
import { getServerOOBI, resolveClientOOBI } from "./apis/oobi.api";
import { getSchema } from "./apis/schema.api";
import { discloseAcdc } from "./apis/discloseAcdc.api";
import { decryptVerifyRequest, encryptSignResponse } from "./middlewares";
import { getAcdcRequirements } from "./apis/acdcRequirements.api";
import { handleReqGrant } from "./apis/handleReqGrant";

export const router = express.Router();
router.post(config.path.ping, decryptVerifyRequest, ping, encryptSignResponse); // POST to test ESSR
router.post(config.path.resolveOOBI, resolveClientOOBI);
router.get(config.path.oobi, getServerOOBI);
router.get(config.path.schema, getSchema);
router.post(config.path.disclosureAcdc, discloseAcdc);
router.get(config.path.acdcRequirements, getAcdcRequirements);
router.get(config.path.handleReqGrant, handleReqGrant);

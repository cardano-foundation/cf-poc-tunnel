import express from "express";
import { config } from "./config";
import { ping } from "./apis/ping.api";
import { getServerOOBI, resolveClientOOBI } from "./apis/oobi.api";
import { getSchema } from "./apis/schema.api";
import { discloseAcdc } from "./apis/discloseAcdc.api";
import { logout } from "./apis/logout.api";
import { decryptVerifyRequest, encryptSignResponse, verifySession } from "./middlewares";
import { getAcdcRequirements } from "./apis/acdcRequirements.api";

export const router = express.Router();
router.post(config.path.ping, verifySession(["user"]), decryptVerifyRequest, ping, encryptSignResponse); // POST to test ESSR
router.post(config.path.logout, verifySession(["user"]), decryptVerifyRequest, logout, encryptSignResponse);
router.post(config.path.resolveOOBI, resolveClientOOBI);
router.get(config.path.oobi, getServerOOBI);
router.get(config.path.schema, getSchema);
router.post(config.path.disclosureAcdc, discloseAcdc);
router.get(config.path.acdcRequirements, getAcdcRequirements);

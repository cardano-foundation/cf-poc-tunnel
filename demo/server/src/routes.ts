import express from "express";
import { config } from "./config";
import { ping } from "./apis/ping.api";
import { getServerOOBI, resolveClientOOBI } from "./apis/oobi.api";
import { encryptResponse } from "./middlewares/encryptResponse.middleware";

const router = express.Router();
// Currently, I am testing the interceptor with the ping api
router.get(config.path.ping, encryptResponse, ping);
router.post(config.path.resolveOOBI, resolveClientOOBI);
router.get(config.path.oobi, getServerOOBI);

export default router;

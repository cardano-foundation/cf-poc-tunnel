import express from "express";
import { config } from "./config";
import { ping } from "./apis/ping.api";

const router = express.Router();
router.get(config.path.ping, ping);
router.post(config.path.resolveOOBI, ping);
router.get(config.path.getServerOOBI, ping);

export default router;

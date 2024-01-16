import express from 'express';
import { config } from './config';
import { ping } from './apis/ping.api';
import { getServerOOBI, resolveClientOOBI } from './apis/oobi.api';
import { schemaApi } from './apis/schema.api';

const router = express.Router();
router.get(config.path.ping, ping);
router.post(config.path.resolveOOBI, resolveClientOOBI);
router.get(config.path.serverOobi, getServerOOBI);
router.get(config.path.schema, schemaApi);

export default router;

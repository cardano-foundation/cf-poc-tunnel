import express from 'express';
import { config } from './config';
import { ping } from './apis/ping.api';
import { getServerOOBI, resolveClientOOBI } from './apis/oobi.api';
import { schemaApi } from './apis/schema.api';
import { disclosureAcdcApi } from './apis/disclosure-acdc.api';

const router = express.Router();
router.get(config.path.ping, ping);
router.post(config.path.resolveOOBI, resolveClientOOBI);
router.get(config.path.oobi, getServerOOBI);
router.get(config.path.schema, schemaApi);
router.post(config.path.disclosureAcdc, disclosureAcdcApi);

export default router;

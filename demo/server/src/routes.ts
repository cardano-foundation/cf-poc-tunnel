import express from 'express';
import { config } from './config';
import { ping } from './apis/ping.api';
import { getServerOOBI, resolveClientOOBI } from './apis/oobi.api';
import { schemaApi } from './apis/schema.api';
import { disclosureAcdcApi } from './apis/disclosure-acdc.api';
import { signResponse, verifyRequest } from "./middlewares";
import { getAcdcRequirements } from './apis/acdc-requirements.api';
import { handleReqGrant } from './apis/handle-req-grant';

const router = express.Router();
// Currently, I am testing the interceptor with the ping api
router.get(config.path.ping, verifyRequest, signResponse, ping);
router.post(config.path.resolveOOBI, resolveClientOOBI);
router.get(config.path.oobi, getServerOOBI);
router.get(config.path.schema, schemaApi);
router.post(config.path.disclosureAcdc, disclosureAcdcApi);
router.get(config.path.acdcRequirements, getAcdcRequirements);
router.get(config.path.handleReqGrant, handleReqGrant);

export default router;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const tune = require('./tune.js');

export const makeContext = tune.makeContext;
export const env2vars = tune.env2vars;
export const text2roles = tune.text2roles;
export const roles2text = tune.roles2text;
export const text2call = tune.text2call;
export const text2expand = tune.text2expand;
export const chat2expand = tune.chat2expand;
export const text2api = tune.text2api;
export const payload2api = tune.payload2api;
export const toolCall = tune.toolCall;
export const makeTool = tune.makeTool;
export const text2run = tune.text2run;
export const text2stream = tune.text2stream;
export const msg2text = tune.msg2text;
export const msg2role = tune.msg2role;
export const text2cut = tune.text2cut;
export const TuneError = tune.TuneError;
export const pparse = tune.pparse;
export const text2var = tune.text2var;

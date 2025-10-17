import Mpegts, * as mpegts from 'mpegts.js';

export class mpegtsCustomLoader extends mpegts.default.BaseLoader {
  constructor(seekHandler: mpegts.default.SeekHandler, config: mpegts.default.Config) {
    super("");
  }

  load(context: any, config: any, callbacks: any) {
    console.log(context, config, callbacks)
  }
}
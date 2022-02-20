/* eslint-disable no-console */
import { processFile } from './audioToMorse';
import { IAudioToMorseParams } from './types/sharedTypes';

const params: IAudioToMorseParams = {
  maxRoundsToZero: 0.05,
  sampleLengthMs: 10,
  morseDihMaxPercentageOfDah: 45,
  smallBreakPercentageOfWordBreak: 20,
  charBreakPercentageOfWordBreak: 50,
};

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log('Give one parameter as input file path. For example: node index.js ../input/message.wav');
    return;
  }

  processFile({
    params,
    fileName: args[0],
  }).then((morse: string) => {
    // simply return the result
    console.log(morse);
  }).catch((reason) => {
    console.error(`Encountered an error ${reason}`);
  });
}

main();

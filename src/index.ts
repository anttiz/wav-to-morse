/* eslint-disable no-console */
import { processFile } from './audioToMorse';
import { IAudioToMorseParams } from './types/sharedTypes';

const params: IAudioToMorseParams = {
  maxRoundsToZero: 0.05, // if value is less than this, it is considered silence
  sampleLengthMs: 10, // sample length in milliseconds
  morseDihMaxPercentageOfDah: 45, // dih must be less than 45% of length of dah
  smallBreakPercentageOfWordBreak: 20, // small break must be less than 20% of word break
  charBreakPercentageOfWordBreak: 50, // char break must be less than 50% of word break
  // following are used to check whether input is correct format containing only Morse code
  soundMinDuration: 5, // 8 has been measured, dih about 80 ms
  soundMaxDuration: 23, // 22 has been measured, dah about 220 ms
};

/**
 * Main function
 */
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

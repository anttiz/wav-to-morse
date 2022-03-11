import { processFile } from '../src/audioToMorse';
import { IAudioToMorseParams } from '../src/types/sharedTypes';

describe('audioToMorse tests', () => {
  it('audioToMorse tests', async () => {
    const params: IAudioToMorseParams = {
      maxRoundsToZero: 0.05,
      sampleLengthMs: 10,
      morseDihMaxPercentageOfDah: 45,
      smallBreakPercentageOfWordBreak: 20,
      charBreakPercentageOfWordBreak: 50,
      soundMinDuration: 5,
      soundMaxDuration: 23,
    };
    const fileName = '../input/message.wav';

    const morse = await processFile({
      params,
      fileName,
    });
    // eslint-disable-next-line no-console
    expect(typeof morse).toStrictEqual('string');
    expect(morse.length).toStrictEqual(65);
    // NOTE: actual result could be shown and tested here but is not
    // as it would reveal secret message.
  });

  it('audioToMorse tests where no Morse code found', async () => {
    const params: IAudioToMorseParams = {
      maxRoundsToZero: 0.05,
      sampleLengthMs: 10,
      morseDihMaxPercentageOfDah: 45,
      smallBreakPercentageOfWordBreak: 20,
      charBreakPercentageOfWordBreak: 50,
      soundMinDuration: 5,
      soundMaxDuration: 23,
    };
    const fileName = '../input/CantinaBand60.wav';

    const morse = await processFile({
      params,
      fileName,
    });
    // eslint-disable-next-line no-console
    expect(typeof morse).toStrictEqual('string');
    expect(morse.length).toStrictEqual(0);
    // NOTE: actual result could be shown and tested here but is not
    // as it would reveal secret message.
  });
});

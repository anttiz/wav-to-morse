/* eslint-disable import/prefer-default-export */
import { readFileSync } from 'fs';
import path from 'path';
import { IAudioToMorseParams, IProcessFileParams } from './types/sharedTypes';

import morseCodes from './morse-codes.json';

const WavDecoder = require('wav-decoder');

// types used in this file
type MorseCodeDataKey = keyof typeof morseCodes;

interface IValueAmount {
  value: number;
  amount: number;
}

interface IBlockData {
  current: number[];
  all: number[][];
}

type MorseSequenceCharacter = 'cb' | 'wb' | 'dih' | 'dah' | '-';

// initial parameters
let params: IAudioToMorseParams = {
  maxRoundsToZero: 0.05, // if value is less than this, it is considered silence
  sampleLengthMs: 10, // sample length in milliseconds
  morseDihMaxPercentageOfDah: 45, // dih must be less than 45% of length of dah
  smallBreakPercentageOfWordBreak: 20, // small break must be less than 20% of word break
  charBreakPercentageOfWordBreak: 50, // char break must be less than 50% of word break
  // following are used to check whether input is correct format containing only Morse code
  soundMinDuration: 5, // 8 has been measured, dih about 80 ms
  soundMaxDuration: 23, // 22 has been measured, dah about 220 ms
};

// internal functions

/**
 * Read input file
 *
 * @param {string} filePath
 * @return {Buffer} File contents as Buffer
 */
function readFile(filePath: string): Buffer {
  return readFileSync(path.join(__dirname, filePath));
}

/**
 * Map given value, amount pair to correct MorseSequenceCharacter.
 *
 * @param {IValueAmount} va
 * @param {number} maxBreakValue
 * @param {number} maxDahValue
 * @return {MorseSequenceCharacter}
 */
function deductMorse(
  va: IValueAmount,
  maxBreakValue: number,
  maxDahValue: number,
): MorseSequenceCharacter {
  if (va.value === 0) {
    // within-character-break, character-break or word-break
    const proportion = va.amount / maxBreakValue;
    if (proportion < params.smallBreakPercentageOfWordBreak / 100) {
      // within-character-break
      return '-';
    }
    if (proportion < params.charBreakPercentageOfWordBreak / 100) {
      // char-break
      return 'cb';
    }
    // word-break
    return 'wb';
  }
  // dih or dah
  return (va.amount / maxDahValue) < params.morseDihMaxPercentageOfDah / 100
    ? 'dih' : 'dah';
}

function toMorse(seq: IValueAmount[]) {
  const currSeq = seq;
  // remove initial and end zeros (silence in the end and in the start)
  while (currSeq.length > 0 && currSeq[0].value === 0) currSeq.shift();
  while (currSeq.length > 0 && currSeq[currSeq.length - 1].value === 0) currSeq.pop();
  // find out the maximum sound value length, this is the maximum of dah sound lengths
  const maxDahValue = Math.max(
    ...currSeq.filter((it) => it.value === 1).map((it) => it.amount),
  );
  // find out the maximum silence value length, this is the max of word breaks
  const maxBreakValue = Math.max(
    ...currSeq.filter((it) => it.value === 0).map((it) => it.amount),
  );
  // create morse sequence
  const morse: MorseSequenceCharacter[] = currSeq
    .map((it) => deductMorse(it, maxBreakValue, maxDahValue));
  return morse;
}

/**
 * Return character that corresponds with Morse code
 *
 * @param {string} code
 * @return {string}
 */
function morseToChar(code: string):string {
  const charKey = Object.keys(morseCodes)
    .find((mc) => morseCodes[mc as MorseCodeDataKey] === code);
  if (charKey) return charKey;
  return '';
}

/**
 * Handle Morse sequence and decode the message.
 *
 * @param {MorseSequenceCharacter[]} arr
 * @return {string} Decoded message
 */
function toPlainText(arr: MorseSequenceCharacter[]):string {
  const initial = {
    total: '',
    current: '',
  };
  const messageData = arr.reduce((acc, curr) => {
    switch (curr) {
      case '-':
        break;
      case 'cb':
      case 'wb': // intentionally same
        if (acc.current) {
          const charKey = morseToChar(acc.current);
          if (charKey) {
            acc.total += charKey;
          }
        }
        acc.current = '';
        if (curr === 'wb') {
          acc.total += ' ';
        }
        break;
      case 'dih':
        acc.current += '.';
        break;
      case 'dah':
        acc.current += '-';
        break;
      default:
        break;
    }
    return acc;
  }, initial);
  // handle still the remaining character
  if (messageData.current) {
    const charKey = morseToChar(messageData.current);
    if (charKey) {
      messageData.total += charKey;
    }
  }
  return messageData.total;
}

/**
 * If input number is less than limit, return 0. Otherwise 1.
 *
 * @param {number} value
 * @return {*}  {number}
 */
const quantitize = (value: number): number => (value < params.maxRoundsToZero ? 0 : 1);

/**
 * format number array of 0 and 1 to be shorter array of IValueAmount
 * e.g. sequence 0,0,0 is represented as object { value: 0, amount: 3 }
 * to make sequence shorter so we can use amount to detect
 * what kind of break or code that item is.
 *
 * @param {IValueAmount[]} acc
 * @param {number} curr
 * @param {number} index
 * @param {number[]} array
 * @return {*}  {IValueAmount[]}
 */
const valueAmountReducer = (
  acc: IValueAmount[],
  curr: number,
  index: number,
  array: number[],
): IValueAmount[] => {
  if (index === 0) {
    acc.push({
      value: curr,
      amount: 1,
    });
  } else if (curr === array[index - 1]) {
    acc[acc.length - 1].amount += 1;
  } else {
    acc.push({
      value: curr,
      amount: 1,
    });
  }
  return acc;
};

/**
 * Validate Morse file to check whether it contains some valid Morse code
 * @param sequence Sequence of 0 and 1 intervals
 * @returns {boolean} Whether input file contains some valid Morse data
 */
function validateSequence(sequence:IValueAmount[]):boolean {
  const minSoundLength = Math.min(
    ...sequence.filter((it) => it.value === 1).map((it) => it.amount),
  );
  const maxSoundLength = Math.max(
    ...sequence.filter((it) => it.value === 1).map((it) => it.amount),
  );
  return (minSoundLength >= params.soundMinDuration && maxSoundLength <= params.soundMaxDuration);
}

/**
 * Processes audio file and returns decoded message as a string.
 *
 * @export
 * @param {IProcessFileParams} processParams
 * @return {Promise<string>}
 */
export async function processFile(processParams: IProcessFileParams): Promise<string> {
  params = processParams.params;
  const { fileName } = processParams;
  // read audio data and decode it
  const buffer: Buffer = readFile(fileName);
  const audioData = await WavDecoder.decode(buffer);
  if (audioData.numberOfChannels !== 1) {
    throw new Error('Audio file does not seem valid');
  }
  const data:number[] = audioData.channelData[0];
  // divide data into x ms blocks.
  const blockSize = Math.floor(audioData.sampleRate / (1000 / params.sampleLengthMs));
  const initial:IBlockData = {
    current: [],
    all: [],
  };
  const blockData:IBlockData = data.reduce((acc, curr) => {
    acc.current.push(curr);
    if (acc.current.length === blockSize) {
      acc.all.push(acc.current);
      acc.current = [];
    }
    return acc;
  }, initial);
  // calculate average value of every block by summing absolute values and
  // dividing by block size
  const filteredData = blockData.all.reduce((acc, curr) => {
    const sum = curr.reduce((acc2, curr2) => acc2 + Math.abs(curr2), 0);
    acc.push(sum / blockSize);
    return acc;
  }, []);
  // normalize samples to be between 0 and 1
  const maxValue = Math.max(...filteredData);
  const sequence: IValueAmount[] = filteredData
    // normalize samples to be between 0 and 1
    .map((it) => it / maxValue)
    // quantitize samples to be either 0 or 1
    .map((it) => quantitize(it))
    // format to be shorter array of IValueAmount
    // e.g. sequence 0,0,0 is represented as object { value: 0, amount: 3 }
    // to make sequence shorter so we can use amount to detect
    // what kind of break or code that item is
    .reduce(valueAmountReducer, [] as IValueAmount[]);
  if (!validateSequence(sequence)) {
    return '';
  }
  // convert sequence of dih and dah's into morse code
  const morse = toMorse(sequence);
  // convert morse code into text
  return toPlainText(morse);
}

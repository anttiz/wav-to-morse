export interface IAudioToMorseParams {
  maxRoundsToZero: number;
  sampleLengthMs: number;
  morseDihMaxPercentageOfDah: number;
  smallBreakPercentageOfWordBreak: number;
  charBreakPercentageOfWordBreak: number;
}

export interface IProcessFileParams {
  params: IAudioToMorseParams;
  fileName: string;
}

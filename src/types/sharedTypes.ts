export interface IAudioToMorseParams {
  maxRoundsToZero: number;
  sampleLengthMs: number;
  morseDihMaxPercentageOfDah: number;
  smallBreakPercentageOfWordBreak: number;
  charBreakPercentageOfWordBreak: number;
  soundMinDuration: number;
  soundMaxDuration: number;
}

export interface IProcessFileParams {
  params: IAudioToMorseParams;
  fileName: string;
}

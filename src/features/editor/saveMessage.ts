export function saveMessage(fileName: string, experiment: number, playful: boolean): string {
  return playful ? `Experiment #${experiment} saved: ${fileName}` : `Saved ${fileName}`;
}

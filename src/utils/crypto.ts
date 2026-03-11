export async function computeBallotHash(selections: string[], previousHash: string, timestamp: string): Promise<string> {
  const sortedSelections = [...selections].sort();
  // Hash formula: SHA-256(sorted_selections + "|" + previous_hash + "|" + timestamp)
  const dataToHash = `${sortedSelections.join(',')}|${previousHash}|${timestamp}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataToHash));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

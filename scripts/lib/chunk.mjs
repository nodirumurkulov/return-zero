/** Split an array into fixed-size chunks (no index loops). */
export function chunkArray(items, size) {
  const chunkCount = Math.ceil(items.length / size);
  return Array.from({ length: chunkCount }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

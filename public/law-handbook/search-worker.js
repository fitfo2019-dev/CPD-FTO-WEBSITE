const shards = new Map();
async function getShard(id) {
  if (!shards.has(id)) {
    shards.set(id, fetch(`./data/search/${id}.json`).then(r => {
      if (!r.ok) throw Error(r.status);
      return r.json();
    }).then(rows => rows.map(([n, text]) => [n, text, text.toLowerCase()])).catch(e => {
      shards.delete(id);
      throw e;
    }));
  }
  return shards.get(id);
}
self.onmessage = async ({data: {id, titles, chapter, query}}) => {
  try {
    const tokens = query.match(/"[^"]+"|[^\s"]+/g)?.map(x => x.replace(/^"|"$/g, "")) ?? [];
    const rows = (await Promise.all(titles.map(getShard))).flat();
    const results = [];
    for (const [n, text, lower] of rows) {
      if (chapter && !n.startsWith(`${chapter}.`)) continue;
      if (!tokens.every(x => lower.includes(x))) continue;
      const phrase = query.replace(/"/g, "");
      const match = lower.indexOf(phrase);
      const i = match < 0 ? lower.indexOf(tokens[0]) : match;
      const l = Math.max(0, i - 38), r = Math.min(text.length, i + (match < 0 ? 105 : phrase.length + 75));
      results.push([n, match < 0 ? 1 : 2, `${l ? "…" : ""}${text.slice(l,r)}${r < text.length ? "…" : ""}`]);
    }
    self.postMessage({id, results});
  } catch {
    self.postMessage({id,error:true});
  }
};

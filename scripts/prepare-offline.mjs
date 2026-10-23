import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const root = "dist/client";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries.map((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name),
    ),
  );
  return results.flat();
}
const files = (await walk(root)).filter((f) => !f.endsWith("sw.js"));
const version = createHash("sha256")
  .update(await readFile(join(root, "index.html")))
  .digest("hex")
  .slice(0, 12);
const urls = files.map((f) => "/" + relative(root, f).replaceAll("\\", "/"));
const worker = `const CACHE='kavach-shell-${version}';
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kavach-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;}
 if(ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});`;
await writeFile(join(root, "sw.js"), worker);
console.log(
  `Prepared offline shell: ${urls.length} static assets. No user content cached.`,
);

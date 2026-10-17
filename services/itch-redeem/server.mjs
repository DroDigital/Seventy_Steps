/** Put behind an HTTPS proxy. Do not log query strings: /redeem receives a short-lived bearer JWT. */
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { readDlcPackage } from '../../desktop/itchDlc.js';
import { ClaimError, ClaimStore, loadConfig } from './core.mjs';

const COOKIE = '__Host-seventy-dlc';
const names = { chariot: 'The Spectral Chariot', automobile: 'The Brassbound Motor Car' };
const filenames = { chariot: 'spectral-chariot', automobile: 'brassbound-motor-car' };
const setSessionCookie = (res, token) => res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900`);
const page = (title, content) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Seventy Steps</title><style>html{color-scheme:dark}body{margin:0;background:#101713;color:#eee9dc;font:18px/1.6 system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}main{max-width:36rem;padding:3rem 1.5rem}small{color:#bcb6a7}h1{font:2.4rem/1.15 Georgia,serif;color:#dfc790}button,a{color:#f3dfaf}button{font:inherit;background:#374e3a;border:1px solid #8d9e68;border-radius:.4rem;padding:.7rem 1.1rem;cursor:pointer}button:hover{background:#465f48}button:focus-visible,a:focus-visible{outline:3px solid #f3dfaf;outline-offset:4px}</style><main><small>SEVENTY STEPS · OPTIONAL MOUNT DLC</small><h1>${title}</h1>${content}<p><a href="https://digitaldro.itch.io/seventy-steps">Return to Seventy Steps</a></p></main></html>`;
const getCookie = req => {
  const entry = (req.headers.cookie ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`));
  return entry?.slice(COOKIE.length + 1);
};

export function createRedeemServer(config, store = new ClaimStore(config)) {
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    const html = (status, title, content) => { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(page(title, content)); };
    const redirect = path => { res.writeHead(303, { Location: path }); res.end(); };
    try {
      const url = new URL(req.url, config.origin);
      if (req.method === 'GET' && url.pathname === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok\n'); return; }
      const sessionToken = getCookie(req);
      if (req.method === 'GET' && url.pathname === '/redeem') {
        if (url.searchParams.getAll('jwt').length !== 1) throw new ClaimError(400, 'Open this page using Claim on your itch.io purchase page.');
        const token = store.start(url.searchParams.get('jwt'), sessionToken);
        setSessionCookie(res, token);
        redirect('/claim'); return;
      }
      if (req.method === 'GET' && url.pathname === '/claim') {
        const session = store.session(sessionToken);
        if (!session) throw new ClaimError(410, 'Your claim session has expired. Return to itch.io and choose Claim again.');
        if (session.claimed) {
          html(200, 'Your mount is ready', `<p>${names[session.mount]} has been claimed.</p><p><a href="/download">Download unlock file</a></p><p>In the game, open Mounts at an Elder Sign, choose <strong>Import mount unlock file</strong>, and select the downloaded file.</p><p>Keep a backup. You can retry this download in this browser for 15 minutes after claiming.</p>`);
        } else {
          html(200, names[session.mount], `<p>Your itch.io purchase is verified. Download your unlock file, then import it in the game's Mounts tab at an Elder Sign.</p><form action="/claim" method="post"><input type="hidden" name="csrf" value="${session.csrf}"><button type="submit">Claim &amp; download unlock</button></form><p>Each purchase can be claimed once. Keep a backup of the file. The appearance becomes usable after completing <em>The Borrowed Reins</em>.</p>`);
        }
        return;
      }
      if (req.method === 'POST' && url.pathname === '/claim') {
        if (req.headers.origin !== config.origin || req.headers['content-type']?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') throw new ClaimError(403, 'Invalid claim request. Return to the claim page and try again.');
        let body = '';
        for await (const chunk of req) {
          body += chunk.toString('utf8');
          if (Buffer.byteLength(body) > 1024) throw new ClaimError(413, 'Claim request too large.');
        }
        const params = new URLSearchParams(body);
        if (params.getAll('csrf').length !== 1) throw new ClaimError(403, 'Invalid claim request.');
        store.claim(sessionToken, params.get('csrf'));
        setSessionCookie(res, sessionToken);
        redirect('/download'); return;
      }
      if (req.method === 'GET' && url.pathname === '/download') {
        const file = store.download(sessionToken);
        if (!file) throw new ClaimError(404, 'Unlock file unavailable. Contact the developer with your itch.io purchase receipt.');
        res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${filenames[file.mount]}.seventysteps-dlc"` });
        res.end(file.receipt); return;
      }
      html(404, 'Page not found', '<p>Return to your itch.io purchase page and choose Claim.</p>');
    } catch (error) {
      if (error instanceof ClaimError) html(error.status, 'Unable to claim', `<p>${error.message}</p>`);
      else {
        // Do not log the request, token, purchase, environment or key material.
        console.error('DLC redemption failed; check persistent database and signing-key availability.');
        html(503, 'Please try again', '<p>Your unlock could not be prepared. Retry in this browser, or contact the developer with your itch.io purchase receipt.</p>');
      }
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.on('close', () => store.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.umask(0o077);
    const config = loadConfig(process.env, readDlcPackage());
    const port = Number(process.env.PORT || 8787);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
    const server = createRedeemServer(config);
    server.on('error', () => { console.error('DLC redemption listener failed. Check HOST and PORT.'); server.close(); process.exitCode = 1; });
    server.listen(port, process.env.HOST || '127.0.0.1', () => console.log('DLC redemption service ready.'));
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
  } catch { console.error('DLC redemption configuration is invalid. See docs/ITCH_DLC_SETUP.md; no secrets are logged.'); process.exitCode = 1; }
}

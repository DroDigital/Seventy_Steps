/**
 * What a report must not carry (round 56): a report is pasted where anyone can read it (a comment on the game's page), and
 * its last errors are the page's own words, which can hold a path through the player's home folder (their name), an
 * e-mail address, or a web address whose query carries a key. Each is taken out, and the rest kept as it was: the file
 * names, line numbers and versions a fix is found by. Pure.
 */

// A Windows home folder's name is every character a folder's name may hold (all but < > : " / \ | ? *: apostrophes, brackets,
// commas and spaces too, O'Neil, Jane Doe (Work)) up to the next separator, or, where none follows, up to a space, ";" or ",".
const HOME_WIN = /([A-Za-z]:(?:\\+|\/+)(?:Users|Documents and Settings)(?:\\+|\/+))(?:[^\\/:"<>|?*\r\n]+?(?=[\\/])|[^\\/\s:"<>|?*;,]+)/gi; // C:\Users\<name>, C:/Users/<name> (a file:// address)
const HOME_UNIX = /(\/(?:Users|home)\/)[^/\s'"`:;,)]+/g; // /Users/<name> (macOS), /home/<name> (Linux): a user's short name, which holds no space or quote
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b/g; // (a version, three@0.170.0, is not one)
// An address up to where its query or fragment begins. What stands just before it says how a delimited one ends.
const ADDRESS = /\b(?:https?|wss?|app|file):\/\/[^\s?#'"`]*[?#]/gi;
const CLOSER: Readonly<Record<string, string>> = { '(': ')', '[': ']', '{': '}', '<': '>', '"': '"', "'": "'", '`': '`' };

/**
 * Where the query that begins at `from` ends. At a space always. An address that stands in a bracket or quote ends at the
 * mark that closes it (`(https://…:2:41)`, `"https://…"`), and a bracket of the same kind inside the query, opened and
 * closed, is the query's own (`?r=https://p.example/(u)?k=…`). An address with nothing before it runs to the space whole,
 * for a quote, a bracket or an apostrophe is as likely to be in a key as to end it: more is taken, never less.
 */
function queryEnd(text: string, from: number, opener: string | undefined): number {
  const closer = opener === undefined ? undefined : CLOSER[opener];
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (/\s/.test(c)) return i;
    if (closer === undefined) continue;
    if (closer !== opener && c === opener) depth++;
    else if (c === closer) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return text.length;
}

/** Each address loses its whole query or fragment (a key, a nested address, colons and all); the `:line:col` a stack trace ends in is kept. */
function stripQueries(text: string): string {
  let out = '';
  let at = 0;
  ADDRESS.lastIndex = 0;
  for (let m = ADDRESS.exec(text); m; m = ADDRESS.exec(text)) {
    const from = m.index + m[0].length;
    const end = queryEnd(text, from, text[m.index - 1]);
    const line = /:\d+:\d+$/.exec(text.slice(from, end))?.[0] ?? '';
    out += text.slice(at, m.index) + m[0].slice(0, -1) + line;
    at = end;
    ADDRESS.lastIndex = end; // what a query held, a nested address too, is gone with it
  }
  return out + text.slice(at);
}

export const scrub = (text: string): string => stripQueries(text.replace(HOME_WIN, '$1<user>').replace(HOME_UNIX, '$1<user>').replace(EMAIL, '<email>'));

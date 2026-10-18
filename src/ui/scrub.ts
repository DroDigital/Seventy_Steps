/**
 * What a report must not carry (round 56): a report is pasted where anyone can read it (a comment on the game's page), and
 * its last errors are the page's own words, which can hold a path through the player's home folder (their name), an
 * e-mail address, or a web address whose query carries a key. Each is taken out, and the rest kept as it was: the file
 * names, line numbers and versions a fix is found by. Pure.
 */

// A home folder's name runs to the next separator, spaces and all (C:\Users\Jane Doe\...), or is one word where none follows.
const HOME_WIN = /([A-Za-z]:(?:\\+|\/+)(?:Users|Documents and Settings)(?:\\+|\/+))(?:[^\\/'"`:;,)\r\n]+?(?=[\\/])|[^\\/\s'"`:;,)]+)/gi; // C:\Users\<name>, C:/Users/<name> (a file:// address)
const HOME_UNIX = /(\/(?:Users|home)\/)(?:[^\\/'"`:;,)\r\n]+?(?=[\\/])|[^\\/\s'"`:;,)]+)/g; // /Users/<name> (macOS), /home/<name> (Linux)
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b/g; // (a version, three@0.170.0, is not one)
const QUERY = /(\b(?:https?|wss?|app|file):\/\/[^\s?#'"`]*)[?#][^\s'"`):]*/gi; // an address keeps its path and line, not its query

export const scrub = (text: string): string =>
  text.replace(HOME_WIN, '$1<user>').replace(HOME_UNIX, '$1<user>').replace(EMAIL, '<email>').replace(QUERY, '$1');

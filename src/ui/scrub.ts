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
const QUERY = /(\b(?:https?|wss?|app|file):\/\/[^\s?#'"`]*)[?#][^\s'"`)]*?(:\d+:\d+)?(?=[\s'"`)]|$)/gim; // an address loses its whole query (a key, a nested address, colons and all) and keeps the line a stack trace points at

export const scrub = (text: string): string =>
  text.replace(HOME_WIN, '$1<user>').replace(HOME_UNIX, '$1<user>').replace(EMAIL, '<email>').replace(QUERY, '$1$2');

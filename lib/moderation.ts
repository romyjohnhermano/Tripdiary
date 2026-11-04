// Ported from moderation.php: community rules, word filters, feelings, report reasons.

export const HIDE_AFTER_REPORTS = 3;
export const PHOTO_REASON = "Inappropriate photo";
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_REPORT_DETAILS = 300;
export const MAX_APPEAL_LENGTH = 500;
export const MAX_ADMIN_NOTE = 300;
export const MAX_MESSAGE_LENGTH = 2000;
export const COURSES = ["BSIT", "BSCS", "BSIS", "BSA"];
export const GENDERS = ["Male", "Female", "Others"];

export const REACTIONS: Record<string, { label: string; emoji: string }> = {
  hug: { label: "Hug", emoji: "🤗" },
  support: { label: "Support", emoji: "💜" },
  strength: { label: "You got this", emoji: "💪" },
};

export const REPORT_REASONS = ["Judging or bullying", "Curse words", "Harmful or dangerous", "Spam", "Other"];

export const FEELINGS: Record<string, string> = {
  sad: "#4c8bf5", anxious: "#e84848", stressed: "#f76707", lonely: "#7950f2", tired: "#4fa8e0",
  overwhelmed: "#f2704a", frustrated: "#e03131", heartbroken: "#6d7ce6", confused: "#8f84e6",
  okay: "#74b816", calm: "#20c997", hopeful: "#8cc63f", grateful: "#5fbf4a", happy: "#fab005", proud: "#ff7a1a",
};

export const CRISIS_HOTLINES: Record<string, string> = {
  "NCMH Crisis Hotline": "1553 (toll-free landline, nationwide)",
  "Globe/TM": "0966-351-4518 / 0917-899-8727",
  "Smart/Sun/TNT": "0908-639-2672",
};

const CURSE_ANYWHERE = ["fuck", "shit", "bitch", "asshole", "bastard", "whore", "slut", "nigger", "nigga", "faggot", "dickhead",
  "tang ina", "kantot", "pakyu", "pakshet", "punyeta", "hinayupak", "tarantado", "tang is na", "esmiringhoy"];
const CURSE_WHOLE = ["hell", "ass", "asses", "dick", "dicks", "cock", "pussy", "damn", "crap", "piss", "prick", "twat", "wanker",
  "fag", "fags", "cunt", "cunts", "puta", "putang", "gago", "gaga", "gagu", "ulol", "ulul", "leche", "letse", "kupal", "pucha",
  "putcha", "shet", "burat", "jakol", "lintik", "tae"];
const UNKIND = ["stupid", "idiot", "idiots", "dumb", "dumbass", "moron", "loser", "pathetic", "retard", "retarded", "crybaby",
  "drama queen", "attention seeker", "attention seeking", "nobody cares", "no one cares", "who cares", "get over it", "man up",
  "suck it up", "your fault", "deserve it", "deserved it", "kill yourself", "kys", "go die", "just die", "shut up", "overreacting",
  "so dramatic", "cringe", "you suck", "hate you", "cry more", "skill issue", "clown", "freak", "weirdo", "disgusting",
  "tanga", "bobo", "boba", "inutil", "walang kwenta", "walang silbi", "ang arte", "arte mo", "maarte", "ang drama", "drama mo",
  "oa", "kasalanan mo", "buti nga", "deserve mo", "pangit mo", "panget mo", "baliw", "mamatay ka", "sana mamatay", "magpakamatay",
  "iyakin", "duwag", "papansin", "epal", "kadiri", "nakakadiri", "hayop ka", "animal ka", "mahina ka", "8080"];
const UNKIND_ABOUT_YOU = ["worthless", "useless", "ugly", "weak", "fat", "crazy", "a joke", "a burden", "a failure"];
const NEGATIONS = ["not", "never", "no", "isn't", "aren't", "wasn't", "weren't", "don't", "ain't", "hindi", "di", "wag", "huwag", "hwag"];
const SELF_HARM = ["kill myself", "killing myself", "end my life", "end it all", "want to die", "wanna die", "suicide", "suicidal",
  "self harm", "hurt myself", "cut myself", "cutting myself", "don't want to live", "no reason to live", "better off dead",
  "better off without me", "can't go on", "tired of living", "gusto ko nang mamatay", "gusto ko na mamatay", "gusto ko ng mamatay",
  "sana mamatay na ako", "ayoko nang mabuhay", "ayoko na mabuhay", "ayoko ng mabuhay", "pagod na akong mabuhay", "magpapakamatay",
  "magpakamatay na lang", "wakasan ko na", "laslas", "maglaslas"];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
const re = (words: string[], whole: boolean) =>
  new RegExp(whole ? `(?<![\\p{L}\\p{N}])(?:${words.map(esc).join("|")})(?![\\p{L}\\p{N}])` : `(?:${words.map(esc).join("|")})`, "giu");

const R_CURSE_ANY = re(CURSE_ANYWHERE, false);
const R_CURSE_WHOLE = re(CURSE_WHOLE, true);
const R_UNKIND = re(UNKIND, true);
const R_ABOUT_YOU = new RegExp(`\\b(?:you|u|ur|you're|youre|you are)\\b[^.!?\\n]{0,12}?(?<![\\p{L}\\p{N}])(?:${UNKIND_ABOUT_YOU.map(esc).join("|")})(?![\\p{L}\\p{N}])`, "iu");
const R_SELF_HARM = re(SELF_HARM, false);

// "***" in place of curse words
export function censor(text: string): string {
  const stars = (m: string) => "*".repeat(m.length);
  return text.replace(R_CURSE_ANY, stars).replace(R_CURSE_WHOLE, stars);
}

function negated(before: string): boolean {
  const words = before.toLowerCase().split(/\s+/).filter(Boolean).slice(-2);
  return words.some((w) => NEGATIONS.includes(w));
}

// Returns the unkind phrase found, or null if the text is fine ("you are not stupid" is allowed)
export function findUnkind(text: string): string | null {
  for (const m of text.matchAll(R_UNKIND)) {
    if (!negated(text.slice(0, m.index))) return m[0];
  }
  const about = text.match(R_ABOUT_YOU);
  if (about && !negated(text.slice(0, about.index! + 12))) return about[0];
  return null;
}

export function needsSupport(text: string): boolean {
  R_SELF_HARM.lastIndex = 0;
  return R_SELF_HARM.test(text);
}

export function preview(text: string | null, image?: string | null, len = 50): string {
  const t = censor((text || "").trim().replace(/\s+/g, " "));
  if (!t) return image ? "📷 Photo" : "(no text)";
  return t.length > len ? t.slice(0, len) + "…" : t;
}

export const NOTE = {
  post_removed: 'An admin removed your post "%s" because it broke the community rules.',
  comment_removed: 'An admin removed your comment "%s" because it broke the community rules.',
  post_kept: 'Good news: an admin reviewed your post "%s" and it is visible again.',
  comment_kept: 'Good news: an admin reviewed your comment "%s" and it is visible again.',
  post_hidden: 'Your post "%s" was hidden after several reports. An admin will review it soon.',
  comment_hidden: 'Your comment "%s" was hidden after several reports. An admin will review it soon.',
  appeal_declined: 'An admin reviewed your appeal about "%s" and decided to keep their decision.',
  appeal_post_removed: 'Good news: an admin accepted your appeal. Your post "%s" is back.',
  appeal_comment_removed: 'Good news: an admin accepted your appeal. Your comment "%s" is back.',
  appeal_post_hidden: 'Good news: an admin accepted your appeal. Your post "%s" is visible again.',
  appeal_comment_hidden: 'Good news: an admin accepted your appeal. Your comment "%s" is visible again.',
} as const;
export const fmt = (tpl: string, s: string) => tpl.replace("%s", s);

// Decisions a student can appeal ("Ask to get it back")
export const APPEALABLE: Record<string, string> = {
  post_removed: "Removed post", comment_removed: "Removed comment",
  post_hidden: "Post hidden by reports", comment_hidden: "Comment hidden by reports",
};

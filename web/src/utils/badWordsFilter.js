// Common inappropriate words that should be filtered
// This is a basic list - you can expand it based on your needs
const badWordsList = [

  'anal', 'anus', 'ass', 'assfuck', 'assfucker', 'asshole', 'assholes',
  'ballsack', 'bastard', 'bastards', 'bestiality', 'bitch', 'bitchass',
  'bitches', 'bitching', 'bitchtits', 'blowjob', 'blowjobs', 'bollocks', 'boner',
  'boob', 'boobs', 'bullshit', 'clit', 'clitoris', 'cock', 'cockbite', 'cockblock',
  'cockhead', 'cockheads', 'cocks', 'cocksucker', 'cocksucking', 'coon', 'coons',
  'crap', 'cum', 'cumdumpster', 'cuming', 'cumming', 'cumshot', 'cunt', 'cunts',
  'damn', 'damned', 'dick', 'dickbag', 'dickface', 'dickfucker', 'dickhead',
  'dickheads', 'dickhole', 'dicks', 'dickwad', 'dickweed', 'die', 'dildo',
  'dildos', 'dingleberry', 'dipshit', 'dipshits', 'douche', 'douchebag',
  'douchebags', 'dumb', 'dumbass', 'dumbasses', 'dumbfuck', 'dumbfucks',
  'dumbshit', 'fag', 'fagbag', 'faggot', 'faggotcock', 'faggots', 'fags',
  'fatass', 'fatfuck', 'foreskin', 'fuck', 'fuckass', 'fuckbag', 'fuckboy',
  'fucked', 'fucker', 'fuckers', 'fuckface', 'fuckhead', 'fuckhole', 'fucking',
  'fucknut', 'fuckoff', 'fuckstick', 'fucktard', 'fucktoy', 'fuckwad', 'fuckwit',
  'gangbang', 'gayass', 'gayfuck', 'goddam', 'goddammit', 'goddamn', 'goddamned',
  'handjob', 'handjobs', 'hardon', 'hell', 'hentai', 'hijo de puta', 'hooker',
  'idiot', 'idiots', 'incest', 'jackass', 'jackoff', 'jerk', 'jerkoff', 'jizz',
  'kill', 'kill yourself', 'lesbo', 'loser', 'losers', 'masturbate', 'masturbation',
  'molest', 'molester', 'molesters', 'molesting', 'moron', 'morons', 'motherfuck',
  'motherfucker', 'motherfuckers', 'motherfucking', 'mothafucka', 'muff',
  'muffdiver', 'murder', 'nazi', 'nazis', 'necrophilia', 'nigga', 'niggas',
  'nigger', 'niggers', 'nimpho', 'nipple', 'nipples', 'nudity', 'nympho',
  'orgasm', 'orgasms', 'paedophile', 'paedophiles', 'paedophilia', 'pedophile',
  'pedophiles', 'pedophilia', 'penis', 'pimp', 'pimps', 'piss', 'pissed', 'pisser',
  'pissing', 'porn', 'porno', 'pornography', 'pron', 'prostitute', 'puta',
  'pussies', 'pussy', 'queef', 'queer', 'queers', 'rape', 'raping', 'rapist',
  'rapists', 'rectum', 'retard', 'retarded', 'retards', 'rimjob', 'rimming',
  'sadist', 'semen', 'sex', 'sexual', 'sexy', 'shit', 'shitass', 'shitbag',
  'shitted', 'shitter', 'shitters', 'shittiest', 'shitting', 'shits', 'shitty',
  'skank', 'skanky', 'slag', 'slut', 'sluts', 'slutty', 'smut', 'smutty', 'snatch',
  'sodomy', 'sonofabitch', 'spastic', 'spastics', 'spic', 'spick', 'spunk',
  'stripper', 'stupid', 'suck', 'sucks', 'suicide', 'tampon', 'taint', 'tard',
  'teabag', 'teabagging', 'terrorist', 'testicle', 'tits', 'titt', 'tittie',
  'titties', 'titty', 'tosser', 'towelhead', 'tranny', 'trash', 'turd', 'twat',
  'twats', 'twink', 'vagina', 'vibrator', 'vomit', 'vulgar', 'wanker', 'whore',
  'whores', 'worthless', 'xxx'

  // Add more words as needed for your community guidelines
];

// Common leetspeak substitutions and special characters to check
const leetMap = {
  '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's',
  '6': 'g', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's',
  '!': 'i', '+': 't', '#': 'h', '%': 'x', '&': 'and', '*': 'x'
};

// Common variations of letters that might be used to bypass filters
const letterVariations = {
  'a': ['a', '4', '@', 'á', 'â', 'ã', 'å'],
  'b': ['b', '8', '6'],
  'c': ['c', '(', '{', '[', '<'],
  'd': ['d'],
  'e': ['e', '3', 'é', 'è', 'ê', 'ë'],
  'f': ['f'],
  'g': ['g', '9', '6'],
  'h': ['h', '#'],
  'i': ['i', '1', '!', 'í', 'ì', 'î', 'ï'],
  'j': ['j'],
  'k': ['k'],
  'l': ['l', '1', '!', '|'],
  'm': ['m'],
  'n': ['n'],
  'o': ['o', '0', 'ó', 'ò', 'ô', 'õ', 'ö'],
  'p': ['p'],
  'q': ['q'],
  'r': ['r'],
  's': ['s', '5', '$', 'z'],
  't': ['t', '7', '+'],
  'u': ['u', 'ú', 'ù', 'û', 'ü'],
  'v': ['v'],
  'w': ['w'],
  'x': ['x', '%', '*'],
  'y': ['y'],
  'z': ['z', '2']
};

class BadWordsFilter {
  constructor() {
    this.badWords = badWordsList;
    this.patterns = this.compilePatterns();
  }

  // Compile regex patterns for each bad word
  compilePatterns() {
    return this.badWords.map(word => {
      // Create a pattern that handles:
      // 1. Leetspeak substitutions
      // 2. Special characters between letters
      // 3. Repeated letters
      // 4. Spaces between letters
      
      const pattern = word.split('').map(char => {
        // Get all possible variations for this character
        const variations = letterVariations[char] || [char];
        
        // Create pattern that matches any variation
        const variationPattern = variations.map(v => 
          v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special characters
        ).join('|');
        
        // Allow for special characters and spaces between letters
        return `(?:${variationPattern})[\\s\\W]*`;
      }).join('');
      
      // Create word boundary pattern to avoid matching within words
      return {
        original: word,
        pattern: new RegExp(`\\b${pattern}\\b`, 'gi')
      };
    });
  }

  // Normalize text for better matching
  normalizeText(text) {
    if (!text) return text;
    
    // Convert to lowercase
    let normalized = text.toLowerCase();
    
    // Replace leetspeak with letters
    for (const [leet, letter] of Object.entries(leetMap)) {
      normalized = normalized.replace(new RegExp(leet, 'g'), letter);
    }
    
    // Remove special characters but keep letters and spaces
    normalized = normalized.replace(/[^a-z\s]/g, '');
    
    // Normalize multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  // Filter bad words from text and replace with asterisks
  filterText(text) {
    if (!text) return text;
    
    let filteredText = text;
    
    // Apply each pattern to replace bad words
    for (const { original, pattern } of this.patterns) {
      filteredText = filteredText.replace(pattern, (match) => {
        // Create asterisks of same length as the matched word
        return '*'.repeat(match.length);
      });
    }
    
    return filteredText;
  }

  // Check if text contains bad words (without filtering)
  containsBadWords(text) {
    if (!text) return false;
    
    const normalized = this.normalizeText(text);
    
    for (const { original } of this.patterns) {
      // Check if the normalized text contains the bad word
      if (normalized.includes(original)) {
        return true;
      }
      
      // Also check for word boundaries
      const regex = new RegExp(`\\b${original}\\b`, 'i');
      if (regex.test(normalized)) {
        return true;
      }
    }
    
    return false;
  }

  // Get list of bad words found in text
  findBadWords(text) {
    if (!text) return [];
    
    const found = [];
    const normalized = this.normalizeText(text);
    
    for (const { original } of this.patterns) {
      const regex = new RegExp(`\\b${original}\\b`, 'i');
      if (regex.test(normalized)) {
        found.push(original);
      }
    }
    
    return [...new Set(found)]; // Remove duplicates
  }

  // Add custom bad words
  addBadWords(words) {
    if (Array.isArray(words)) {
      this.badWords = [...this.badWords, ...words.map(w => w.toLowerCase())];
    } else {
      this.badWords.push(words.toLowerCase());
    }
    this.patterns = this.compilePatterns();
  }
}

// Create and export a singleton instance
const badWordsFilter = new BadWordsFilter();
export default badWordsFilter;
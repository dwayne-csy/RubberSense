// RubberSense/Web/src/Components/User/BadWords.js

/**
 * Bad Words Filter List
 * Contains profanity and inappropriate words to filter from user content
 */

export const badWordsList = [
  // English profanity
  'fuck', 'fucking', 'fucker', 'fuckers', 'fucked', 
  'shit', 'shitting', 'shitter', 'shitters',
  'ass', 'asshole', 'assholes', 
  'bitch', 'bitches', 'bitching', 
  'cunt', 'cunts',
  'dick', 'dicks', 'dickhead', 'dickheads', 
  'cock', 'cocks', 'cockhead', 'cockheads',
  'pussy', 'pussies', 
  'twat', 'twats', 
  'whore', 'whores', 
  'slut', 'sluts',
  'bastard', 'bastards', 
  'motherfucker', 'motherfuckers', 'motherfucking',
  'nigga', 'nigger', 'niggas', 'niggers', 
  'faggot', 'faggots', 'fag', 'fags',
  'retard', 'retards', 'retarded', 
  'spastic', 'spastics',
  'porn', 'porno', 'pornography', 'xxx', 'hentai',
  'penis', 'vagina', 'boob', 'boobs', 'tits', 'titties', 'nipple', 'nipples',
  'anal', 'anus', 'blowjob', 'blowjobs', 'handjob', 'handjobs',
  'cum', 'cuming', 'cumming', 'semen', 'sperm',
  'orgasm', 'orgasms', 'masturbate', 'masturbation',
  'rape', 'raping', 'rapist', 'rapists', 'molest', 'molesting', 'molester', 'molesters',
  'pedophile', 'pedophiles', 'pedophilia', 'paedophile', 'paedophiles', 'paedophilia',
  'incest', 'bestiality', 'necrophilia',

  // Offensive terms
  'idiot', 'idiots', 'stupid', 'dumb', 'dumbass', 'dumbasses', 'moron', 'morons',
  'loser', 'losers', 'pathetic', 'worthless', 'trash',
  'kill yourself', 'kys', 'die', 'kill', 'murder', 'suicide',

  // Racial slurs
  'chink', 'chinks', 'gook', 'gooks', 'spic', 'spics', 'spick', 'spicks',
  'wetback', 'wetbacks', 'beaner', 'beaners', 'kike', 'kikes',
  'raghead', 'ragheads', 'towelhead', 'towelheads',
  'sand nigger', 'sand niggers', 'paki', 'pakis',

  // Religious offensiveness
  'god damn', 'goddamn', 'goddamned', 'hell', 'damn', 'damned',

  // Threatening terms
  'bomb', 'terrorist', 'terrorism', 'explosive', 'explosives',
  'shoot', 'shooting', 'gun', 'guns', 'weapon', 'weapons',
  'assassinate', 'assassination',

  // Common leet speak variants
  'f4ck', 'fuk', 'fukking', 'phuck', 'phuk',
  'sh1t', 'sh!t', 'shiit',
  'b1tch', 'b!tch',
  'c0ck', 'n1gga', 'n!gga', 'n1gger', 'n!gger',
  'f4g', 'f4gg0t', 'f@g', 'f@ggot',
  '4ss', '@ss', 'azz',
  'h0e', 'wh0re',

  // Combined words
  'assfuck', 'assfucker', 'ballsack', 'bastardo',
  'bitchass', 'bitchtits', 'bollocks', 'boner',
  'bullshit', 'clit', 'clitoris', 'cockbite', 'cockblock',
  'cocksucker', 'cocksucking', 'coon', 'coons', 'cumdumpster',
  'cumshot', 'dickbag', 'dickface', 'dickfucker', 'dickhole',
  'dickwad', 'dickweed', 'dildo', 'dildos', 'dingleberry',
  'dipshit', 'dipshits', 'douche', 'douchebag', 'douchebags',
  'dumbfuck', 'dumbfucks', 'dumbshit', 'fagbag', 'faggotcock',
  'fatass', 'fatfuck', 'foreskin', 'fuckass', 'fuckbag', 'fuckboy',
  'fuckface', 'fuckhead', 'fuckhole', 'fucknut', 'fuckoff',
  'fuckstick', 'fucktard', 'fucktoy', 'fuckwad', 'fuckwit',
  'gangbang', 'gayass', 'gayfuck', 'goddam', 'goddammit',
  'goddamn', 'goddamned', 'handjob', 'hardon', 'hooker',
  'jackass', 'jackoff', 'jerk', 'jerkoff', 'jizz', 'kike',
  'lesbo', 'lezbo', 'mothafucka', 'motherfuck', 'motherfucker',
  'muff', 'muffdiver', 'nazi', 'nazis', 'nigger', 'niggers',
  'nimpho', 'nipple', 'nipples', 'nudity', 'nympho',
  'pecker', 'peckerhead', 'pedo', 'pedophile', 'pedophiles',
  'penis', 'pimp', 'pimps', 'piss', 'pissed', 'pisser',
  'pissing', 'prick', 'pricks', 'pron', 'prostitute',
  'pussies', 'pussy', 'queef', 'queer', 'queers',
  'rapist', 'rectum', 'retard', 'retarded', 'retards',
  'rimjob', 'rimming', 'sadist', 'semen', 'sex', 'sexual',
  'sexy', 'shitass', 'shitbag', 'shithead', 'shithole',
  'shits', 'shitted', 'shitter', 'shitters', 'shittiest',
  'shitting', 'shitty', 'skank', 'skanky', 'slut', 'sluts',
  'slutty', 'smut', 'smutty', 'snatch', 'sodomy', 'sonofabitch',
  'spic', 'spick', 'spunk', 'stripper', 'suck', 'sucks',
  'taint', 'tampon', 'tard', 'teabag', 'teabagging', 'terrorist',
  'testicle', 'tits', 'titt', 'tittie', 'titties', 'titty',
  'tosser', 'towelhead', 'tranny', 'turd', 'twat', 'twink',
  'vagina', 'vibrator', 'vomit', 'vulgar', 'whore', 'whores',

  // Common misspellings
  'fuuck', 'fuucck', 'phuk', 'fuk', 'shiiit', 'beeeyotch',
  'diiick', 'dyck', 'puussy', 'cuunt', 'biatch', 'byatch',
  'daaaamn', 'gawddammit',

  // Non-English offensive terms (common ones)
  'puta', 'putas', 'puto', 'putos', 'pendejo', 'pendejos',
  'cabron', 'cabrones', 'maricon', 'maricones',
  'hijo de puta', 'mierda', 'carajo', 'chinga', 'chingada'
];

export default badWordsList;
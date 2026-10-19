/* Toutes les refs vivent ici. */
window.DATA = {

  tiers: [
    { id: 'menpreg',   name: 'menpreg',                  icon: '🫃', cost: 60,    cps: 1,     line: '' },
    { id: 'escargot',  name: 'escargot',                 icon: '🐌', cost: 120,   cps: 3,     line: 'Marie.' },
    { id: 'cookie',    name: 'cookieeeeee',              icon: '🍪', cost: 240,   cps: 8,     line: 'pour toi' },
    { id: 'haircat',   name: 'haircat',                  icon: '🐈', cost: 480,   cps: 22,    line: 'elle dort' },
    { id: 'teinture',  name: 'teinture verte',           icon: '🟢', cost: 960,   cps: 60,    line: 'ça part au premier lavage', clickMult: 2 },
    { id: 'banjo',     name: 'banjo qui rend injouable', icon: '🪕', cost: 1920,  cps: 150,   line: 'non.' },
    { id: 'aupinard',  name: 'aupinard',                 icon: '🎤', cost: 3840,  cps: 400,   line: 'encore' },
    { id: 'strap',     name: 'strap on',                 icon: '🔞', cost: 7680,  cps: 1100,  line: 'le deuxième', clickMult: 3 },
    { id: 'pigeons',   name: 'healer de pigeons',        icon: '🐦', cost: 15360, cps: 3000,  line: 'il a survécu' },
    { id: 'pisskink',  name: '"non j\'ai pas un piss kink"', icon: '💧', cost: 30720, cps: 8000, line: '' }
  ],

  ticker: [
    "t'es drôle", "t'es beau", "j'aime ta voix", "t'es pas bizarre",
    "t'es pas chiant", "t'es pas un poids", "tu prends pas trop de place",
    "t'as le droit de dire non", "t'es pas obligé de dire oui",
    "tes limites comptent", "j'aime tes mains", "j'aime tes cheveux",
    "j'aime ta moustache", "j'aime ton rire", "j'aime quand tu parles",
    "t'écris bien", "t'es légitime", "tu peux être fatigué",
    "tu peux être triste", "tu peux être en colère", "tu peux être clingy",
    "tu peux m'écrire trente fois", "je partirai pas", "t'es doux",
    "t'es fort", "j'aime ta compagnie", "tu me fais rire",
    "tu me fais du bien", "je suis fière de toi", "tu me rends meilleure",
    "t'es pas trop pour moi", "j'ai envie de te voir", "tu me manques déjà",
    "t'es mieux que ce que tu crois", "KIFFEUR", "je taime <3", "meep"
  ],

  goals: [
    { id: 'g1',  label: 'un clic',        type: 'clicks', target: 1,       reward: { type: 'meeps', sec: 15, min: 40 },     gift: '+15 s' },
    { id: 'g2',  label: 'cent clics',     type: 'clicks', target: 100,     reward: { type: 'meeps', sec: 25, min: 120 },    gift: '+25 s' },
    { id: 'g3',  label: '700 clics',      type: 'clicks', target: 700,     reward: { type: 'frenzy', mult: 2, dur: 20 },    gift: '×2 / 20 s' },
    { id: 'g4',  label: '1 000 meeps',    type: 'total',  target: 1000,    reward: { type: 'meeps', sec: 30, min: 200 },    gift: '+30 s' },
    { id: 'g5',  label: '10 000 meeps',   type: 'total',  target: 10000,   reward: { type: 'meeps', sec: 40, min: 500 },    gift: '+40 s' },
    { id: 'g6',  label: '100 000 meeps',  type: 'total',  target: 100000,  reward: { type: 'frenzy', mult: 3, dur: 20 },    gift: '×3 / 20 s' },
    { id: 'g7',  label: 'un million',     type: 'total',  target: 1000000, reward: { type: 'meeps', sec: 60, min: 3000 },   gift: '+60 s' },
    { id: 'g8',  label: 'cinq paliers',   type: 'tiers',  target: 5,       reward: { type: 'meeps', sec: 30, min: 300 },    gift: '+30 s' },
    { id: 'g9',  label: 'les dix',        type: 'tiers',  target: 10,      reward: { type: 'frenzy', mult: 3, dur: 25 },    gift: '×3 / 25 s' },
    { id: 'g10', label: 'dix meep',       type: 'meep',   target: 10,      reward: { type: 'meeps', sec: 45, min: 800 },    gift: '+45 s' },
    { id: 'g12', label: '5 malus cliqués', type: 'malus', target: 5,      reward: { type: 'meeps', sec: 40, min: 400 },    gift: '+40 s' }
  ],

  cheats: [
    {
      id: 'marie',
      q: 'ma pâtisserie préférée',
      answers: ['flanc', 'flan'],
      reward: { type: 'meeps', mult: 30 },
      gift: '30 secondes'
    },
    {
      id: 'oly',
      q: 'le nom de mon chat noir',
      answers: ['oslo'],
      reward: { type: 'frenzy', mult: 3, dur: 20 },
      gift: 'x3 pendant 20 s'
    },
    {
      id: 'strap',
      q: 'ma position préférée pour bottom',
      answers: ['levrette'],
      reward: { type: 'free' },
      gift: 'un palier offert'
    }
  ],

  gift: {
    hint: 'aupinard',
    answers: ['aupinard'],
    prize: [
      'jte prends 2 places pour le concert',
      'AUPINARD',
      'ZENITH PARIS LA VILLETTE — PARIS',
      'Vendredi 2 avril 2027 à 20:00'
    ]
  }
};

/**
 * Words for Sound It Out. Each is made only of recorded sounds (no silent or
 * double letters), so a child can read it by blending its sounds. Level 3 uses
 * the NATIVE letter sounds: in these Cameroonian words u says "oo", i says "ee".
 * Adding a word: its sounds must join to spell it, and it needs a picture in
 * public/pictures/ (tests check both) and ideally a word clip (robot until then).
 */
const w = (word, sounds, picture, level, voice = 'standard') => ({ word, sounds, picture, level, voice });

export const BLEND_WORDS = [
  w('sun', ['s', 'u', 'n'], '2600', 1), w('cat', ['c', 'a', 't'], '1f408', 1),
  w('pig', ['p', 'i', 'g'], '1f416', 1), w('hen', ['h', 'e', 'n'], '1f414', 1),
  w('dog', ['d', 'o', 'g'], '1f415', 1), w('bus', ['b', 'u', 's'], '1f68c', 1),
  w('fox', ['f', 'o', 'x'], '1f98a', 1), w('box', ['b', 'o', 'x'], '1f4e6', 1),
  w('ant', ['a', 'n', 't'], '1f41c', 1), w('bat', ['b', 'a', 't'], '1f987', 1),
  w('bed', ['b', 'e', 'd'], '1f6cf', 1), w('van', ['v', 'a', 'n'], '1f690', 1),
  w('fish', ['f', 'i', 'sh'], '1f41f', 2), w('milk', ['m', 'i', 'l', 'k'], '1f95b', 2),
  w('frog', ['f', 'r', 'o', 'g'], '1f438', 2), w('hand', ['h', 'a', 'n', 'd'], '270b', 2),
  w('drum', ['d', 'r', 'u', 'm'], '1f941', 2), w('flag', ['f', 'l', 'a', 'g'], '1f6a9', 2),
  w('tent', ['t', 'e', 'n', 't'], '26fa', 2), w('crab', ['c', 'r', 'a', 'b'], '1f980', 2),
  w('ship', ['sh', 'i', 'p'], '1f6a2', 2), w('nest', ['n', 'e', 's', 't'], '1faba', 2),
  w('mama', ['m', 'a', 'm', 'a'], '1f469', 3, 'native'), w('papa', ['p', 'a', 'p', 'a'], '1f468', 3, 'native'),
  w('koki', ['k', 'o', 'k', 'i'], '1fad8', 3, 'native'), w('kribi', ['k', 'r', 'i', 'b', 'i'], '1f3d6', 3, 'native'),
  w('buea', ['b', 'u', 'e', 'a'], '26f0', 3, 'native'),
];

export const picturePath = (code) => `pictures/${code}.svg`;
export const PICTURE_CREDIT = 'Pictures: Twemoji, CC-BY 4.0';

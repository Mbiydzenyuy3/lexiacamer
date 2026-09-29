import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, ArrowRight, RotateCcw } from 'lucide-react';
import speechEngine from './speech';
import Confetti from './Confetti';
import { BLEND_WORDS, picturePath } from './blendWords';
import { loadBlendState, saveBlendState, pickRound, choicesFor, afterRound } from './blendRound';

/**
 * Sound It Out: blending, which is reading.
 *
 * The word appears as one tile per sound. The child taps each tile to hear
 * its sound, "Say it fast" plays them in a row so the word pops out, then the
 * child picks the matching picture. A wrong pick replays the sounds; two wrong
 * picks make the right picture glow, so a child alone is never stuck.
 */
export default function BlendGame({ t, lang, onWordCorrect, onWordMissed, onRoundComplete, rng = Math.random }) {
  const [level, setLevel] = useState(loadBlendState);
  const [round, setRound] = useState(() => pickRound(level, BLEND_WORDS, rng));
  const [index, setIndex] = useState(0);
  const [lit, setLit] = useState([]);           // tiles tapped
  const [active, setActive] = useState(null);   // tile sounding in "Say it fast"
  const [misses, setMisses] = useState(0);
  const [wrongPick, setWrongPick] = useState(null);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [finished, setFinished] = useState(false);
  const praiseTimer = useRef(null);

  const word = round[index];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const choices = useMemo(() => choicesFor(word, BLEND_WORDS, rng), [word]);

  useEffect(() => () => { clearTimeout(praiseTimer.current); speechEngine.stop(); }, []);

  const tapTile = (i) => {
    speechEngine.speakLetter(word.sounds[i], lang, word.voice);
    setLit((l) => (l.includes(i) ? l : [...l, i]));
  };

  const sayItFast = () => {
    speechEngine.speakSounds(word.sounds, word.voice, {
      lang,
      onEach: (i) => { setActive(i); setLit((l) => (l.includes(i) ? l : [...l, i])); },
    });
  };

  const pick = (choice) => {
    if (solved) return;
    if (choice.word === word.word) {
      setSolved(true);
      setActive(null);
      if (misses === 0) setFirstTry((n) => n + 1);
      onWordCorrect(word.word);
      speechEngine.speakWord(word.word, lang);
      praiseTimer.current = setTimeout(() => speechEngine.speakCelebration(lang), 1100);
      return;
    }
    setMisses((m) => m + 1);
    setWrongPick(choice.word);
    onWordMissed(word.sounds);
    sayItFast();
  };

  const next = () => {
    clearTimeout(praiseTimer.current);
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setLit([]); setActive(null); setMisses(0); setWrongPick(null); setSolved(false);
      return;
    }
    const updated = afterRound(level, firstTry);
    saveBlendState(updated);
    onRoundComplete(level.level, firstTry);
    setLevel(updated);
    setFinished(true);
  };

  const playAgain = () => {
    setRound(pickRound(level, BLEND_WORDS, rng));
    setIndex(0); setLit([]); setActive(null); setMisses(0); setWrongPick(null);
    setSolved(false); setFirstTry(0); setFinished(false);
  };

  if (finished) {
    return (
      <div className="screen blend">
        <Confetti active />
        <div className="blend-done">
          <h2>{t.blendRoundDone.replace('{n}', String(firstTry))}</h2>
          <p className="text-muted">{t.blendLevel} {level.level}</p>
          <button type="button" className="btn btn-primary" onClick={playAgain}>
            <RotateCcw size={18} /> {t.blendPlayAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen blend">
      <div className="screen-header">
        <h2 className="mb-0">{t.blendTitle}</h2>
        <span className="blend-progress">{t.blendLevel} {level.level} · {index + 1}/{round.length}</span>
      </div>

      <div className="screen-body">
      <p className="blend-instruction">{t.blendTapLetters}</p>
      <div className="blend-tiles">
        {word.sounds.map((sound, i) => (
          <button key={`${word.word}-${i}`} type="button"
                  className={`blend-tile${lit.includes(i) ? ' is-lit' : ''}${active === i ? ' is-active' : ''}`}
                  onClick={() => tapTile(i)}>
            {sound.toUpperCase()}
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-outline blend-fast" onClick={sayItFast}>
        <Volume2 size={18} /> {t.blendSayItFast}
      </button>

      <p className="blend-instruction">{t.blendFindPicture}</p>
      <div className="blend-pictures">
        {choices.map((c, i) => {
          const isAnswer = c.word === word.word;
          const cls = ['blend-picture',
            solved && isAnswer ? 'is-right' : '',
            !solved && misses >= 2 && isAnswer ? 'is-hint' : '',
            wrongPick === c.word && !solved ? 'is-wrong' : ''].filter(Boolean).join(' ');
          return (
            <button key={c.word} type="button" className={cls} data-word={c.word}
                    aria-label={`${t.blendChoice} ${i + 1}`} onClick={() => pick(c)}>
              <img src={`${import.meta.env.BASE_URL}${picturePath(c.picture)}`} alt="" draggable="false" />
            </button>
          );
        })}
      </div>

      {solved && (
        <button type="button" className="btn btn-primary blend-next" onClick={next}>
          {index + 1 < round.length ? t.blendNext : t.blendFinish} <ArrowRight size={18} />
        </button>
      )}
      </div>
    </div>
  );
}

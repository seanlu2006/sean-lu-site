(() => {
  const root = document.documentElement;
  root.classList.add('js');

  function refreshCardLabel() {
    const currentCard = document.querySelector('.flashcard');
    if (!currentCard) return;
    const currentWord = document.querySelector('.card-word')?.textContent || '';
    const action = currentCard.classList.contains('is-flipped') ? 'Show the front of' : 'Show the meaning of';
    currentCard.setAttribute('aria-label', `${action}: ${currentWord}`);
  }

  const samples = [
    {
      word: 'mitigate',
      type: 'verb',
      meaning: '減輕；緩和',
      example: 'The policy aims to mitigate the impact of rising housing costs.'
    },
    {
      word: 'ubiquitous',
      type: 'adjective',
      meaning: '無所不在的',
      example: 'Smartphones have become ubiquitous in everyday life.'
    },
    {
      word: 'scrutinize',
      type: 'verb',
      meaning: '仔細檢查',
      example: 'The committee will scrutinize the evidence before making a decision.'
    }
  ];

  const card = document.querySelector('.flashcard');
  const nextButton = document.querySelector('.next-card');
  const word = document.querySelector('.card-word');
  const type = document.querySelector('.word-kind');
  const meaning = document.querySelector('.card-meaning');
  const example = document.querySelector('.card-example');
  const count = document.querySelector('.demo-count');
  let sampleIndex = 0;

  function updateCard() {
    const sample = samples[sampleIndex];
    card.classList.remove('is-flipped');
    card.setAttribute('aria-pressed', 'false');
    card.querySelector('.flash-front').setAttribute('aria-hidden', 'false');
    card.querySelector('.flash-back').setAttribute('aria-hidden', 'true');
    word.textContent = sample.word;
    type.textContent = sample.type;
    meaning.textContent = sample.meaning;
    example.textContent = sample.example;
    count.textContent = `${String(sampleIndex + 1).padStart(2, '0')} / ${String(samples.length).padStart(2, '0')}`;
    refreshCardLabel();
  }

  card?.addEventListener('click', () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    card.querySelector('.flash-front').setAttribute('aria-hidden', String(flipped));
    card.querySelector('.flash-back').setAttribute('aria-hidden', String(!flipped));
    refreshCardLabel();
  });

  nextButton?.addEventListener('click', () => {
    sampleIndex = (sampleIndex + 1) % samples.length;
    updateCard();
    card.focus({ preventScroll: true });
  });

  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Motion clip: loads and plays only while on screen; never autoplays for
  // reduced-motion visitors (they get the poster and can click to play).
  const clip = document.querySelector('.motion-clip');
  if (clip) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let userPaused = false;
    clip.addEventListener('click', () => {
      if (clip.paused) { userPaused = false; clip.play().catch(() => {}); }
      else { userPaused = true; clip.pause(); }
    });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !userPaused) clip.play().catch(() => {});
          else if (!entry.isIntersecting) clip.pause();
        });
      }, { threshold: 0.4 }).observe(clip);
    }
  }
})();

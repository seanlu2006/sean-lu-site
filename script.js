(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const languageButtons = [...document.querySelectorAll('[data-lang]')];

  function refreshLocalizedAccessibility() {
    const isEnglish = root.lang === 'en';
    const currentCard = document.querySelector('.flashcard');
    const currentWord = document.querySelector('.card-word')?.textContent || '';
    const flipped = currentCard?.classList.contains('is-flipped');

    if (currentCard) {
      const action = isEnglish
        ? (flipped ? 'Show the front of' : 'Show the meaning of')
        : (flipped ? '翻回單字卡' : '翻開單字卡');
      currentCard.setAttribute('aria-label', isEnglish ? `${action}: ${currentWord}` : `${action}：${currentWord}`);
    }

    document.querySelectorAll('[data-alt-zh][data-alt-en]').forEach((image) => {
      image.alt = isEnglish ? image.dataset.altEn : image.dataset.altZh;
    });
  }

  function setLanguage(language) {
    root.lang = language;
    languageButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === language));
    });

    try {
      localStorage.setItem('portfolio-language', language);
    } catch (_) {
      // The switch still works when storage is unavailable.
    }

    refreshLocalizedAccessibility();
  }

  languageButtons.forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });

  let storedLanguage;
  try {
    storedLanguage = localStorage.getItem('portfolio-language');
  } catch (_) {
    storedLanguage = null;
  }

  if (storedLanguage === 'en' || storedLanguage === 'zh-Hant') {
    setLanguage(storedLanguage);
  } else if (!/^zh/i.test(navigator.language || '')) {
    setLanguage('en');
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
    refreshLocalizedAccessibility();
  }

  card?.addEventListener('click', () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    card.querySelector('.flash-front').setAttribute('aria-hidden', String(flipped));
    card.querySelector('.flash-back').setAttribute('aria-hidden', String(!flipped));
    refreshLocalizedAccessibility();
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
})();

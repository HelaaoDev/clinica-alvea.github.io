/* ==========================================================================
   Clínica Alvea — Landing Page JS
   Menu mobile, accordion FAQ, reveal on scroll, profissionais e carrossel
   ========================================================================== */

const ALVEA_LANDING_API_BASE_URL = window.ALVEA_API_BASE_URL;

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sessão do usuário no header público ---------- */
  const sessaoAtual = typeof alveaGetSession === 'function' ? alveaGetSession() : null;
  const headerEntrarBtn = document.getElementById('headerEntrarBtn');
  const headerUserLink = document.getElementById('headerUserLink');
  const headerAgendarBtn = document.getElementById('headerAgendarBtn');
  const headerLogoutBtn = document.getElementById('headerLogoutBtn');

  if (sessaoAtual && headerEntrarBtn && headerUserLink) {
    headerEntrarBtn.hidden = true;
    headerUserLink.hidden = false;
    document.getElementById('headerUserName').textContent = sessaoAtual.usuario.nome;
    alveaRenderAvatar('headerUserAvatar', sessaoAtual.usuario);

    if (headerAgendarBtn) {
      headerAgendarBtn.href = 'paciente/agendar.html';
    }

    if (headerLogoutBtn) {
      headerLogoutBtn.hidden = false;
      headerLogoutBtn.addEventListener('click', () => {
        alveaClearSession();
        window.location.reload();
      });
    }
  }

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mainNav.classList.remove('open'));
    });
  }

  /* ---------- FAQ accordion ---------- */
  const faqItems = document.querySelectorAll('.faq-item');

  function setAnswerHeight(item, open) {
    const answer = item.querySelector('.faq-answer');
    if (!answer) return;
    answer.style.maxHeight = open ? answer.scrollHeight + 'px' : '0px';
  }

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');

    // Estado inicial
    setAnswerHeight(item, item.classList.contains('open'));

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach((other) => {
        other.classList.remove('open');
        setAnswerHeight(other, false);
      });

      if (!isOpen) {
        item.classList.add('open');
        setAnswerHeight(item, true);
      }
    });
  });

  window.addEventListener('resize', () => {
    faqItems.forEach((item) => {
      if (item.classList.contains('open')) setAnswerHeight(item, true);
    });
  });

  /* ---------- Nossos Profissionais ---------- */
  const professionalsGrid = document.getElementById('professionalsGrid');

  function iniciaisDe(nome) {
    return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  function slugNome(nome) {
    return nome
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\./g, '')
      .trim()
      .replace(/\s+/g, '_');
  }

  const MAPA_ESPECIALIDADE_PARA_TIPO = {
    'Clínico Geral': 'medico',
    'Cardiologia': 'medico',
    'Exames Laboratoriais': 'exames',
    'Exames de Imagem': 'exames',
    'Nutrição': 'nutricao',
    'Medicina do Trabalho': 'outros',
    'Fisioterapia': 'outros',
  };
  if (professionalsGrid) {
    fetch(`${ALVEA_LANDING_API_BASE_URL}/profissionais`)
      .then((res) => res.json())
      .then((profissionais) => {
        if (!profissionais.length) {
          professionalsGrid.innerHTML = '<p style="color:var(--alvea-text-muted); font-size:14px; text-align:center; grid-column:1/-1;">Nenhum profissional cadastrado no momento.</p>';
          return;
        }

        professionalsGrid.innerHTML = profissionais.map((prof) => `
          <div class="professional-tile">
            <img class="avatar-photo" src="img/retratos_medicos/${slugNome(prof.nome)}.jpeg" alt="${prof.nome}">
            <div class="prof-nome">${prof.nome}</div>
            <div class="prof-especialidade">${prof.especialidade}</div>
          </div>
        `).join('');

        professionalsGrid.querySelectorAll('.avatar-photo').forEach((img) => {
          img.addEventListener('error', () => {
            const circle = document.createElement('div');
            circle.className = 'avatar-circle';
            circle.textContent = iniciaisDe(img.alt);
            img.replaceWith(circle);
          }, { once: true });
        });
      })
      .catch(() => {
        professionalsGrid.innerHTML = '<p style="color:var(--alvea-text-muted); font-size:14px; text-align:center; grid-column:1/-1;">Não foi possível carregar os profissionais. Verifique se o servidor está rodando.</p>';
      });
  }

  /* ---------- Carrossel de imagens do Hero ---------- */
  const heroTrack = document.getElementById('heroBgTrack');
  const heroDotsContainer = document.getElementById('heroBgDots');

  if (heroTrack && heroDotsContainer) {
    const heroSlides = Array.from(heroTrack.children);
    let heroIndiceAtual = 0;
    let heroIntervalo = null;

    heroSlides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ver imagem ${i + 1}`);
      dot.addEventListener('click', () => { irParaSlideHero(i); reiniciarAutoRotacaoHero(); });
      heroDotsContainer.appendChild(dot);
    });

    const heroDots = Array.from(heroDotsContainer.children);

    function irParaSlideHero(indice) {
      heroIndiceAtual = indice;
      heroSlides.forEach((slide, i) => slide.classList.toggle('active', i === heroIndiceAtual));
      heroDots.forEach((d, i) => d.classList.toggle('active', i === heroIndiceAtual));
    }

    function proximoSlideHero() {
      irParaSlideHero((heroIndiceAtual + 1) % heroSlides.length);
    }

    function iniciarAutoRotacaoHero() {
      heroIntervalo = setInterval(proximoSlideHero, 5500);
    }

    function pausarAutoRotacaoHero() {
      clearInterval(heroIntervalo);
    }

    function reiniciarAutoRotacaoHero() {
      pausarAutoRotacaoHero();
      iniciarAutoRotacaoHero();
    }

    if (heroSlides.length > 1) {
      iniciarAutoRotacaoHero();
      const heroEl = document.querySelector('.hero');
      heroEl.addEventListener('mouseenter', pausarAutoRotacaoHero);
      heroEl.addEventListener('mouseleave', iniciarAutoRotacaoHero);
    }
  }

  /* ---------- Carrossel de depoimentos ---------- */
  const track = document.getElementById('testimonialTrack');
  const dotsContainer = document.getElementById('testimonialDots');

  if (track && dotsContainer) {
    const slides = Array.from(track.children);
    let indiceAtual = 0;
    let intervalo = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ver depoimento ${i + 1}`);
      dot.addEventListener('click', () => { irParaSlide(i); reiniciarAutoRotacao(); });
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function irParaSlide(indice) {
      indiceAtual = indice;
      track.style.transform = `translateX(-${indiceAtual * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === indiceAtual));
    }

    function proximoSlide() {
      irParaSlide((indiceAtual + 1) % slides.length);
    }

    function slideAnterior() {
      irParaSlide((indiceAtual - 1 + slides.length) % slides.length);
    }

    function iniciarAutoRotacao() {
      intervalo = setInterval(proximoSlide, 6500);
    }

    function pausarAutoRotacao() {
      clearInterval(intervalo);
    }

    function reiniciarAutoRotacao() {
      pausarAutoRotacao();
      iniciarAutoRotacao();
    }

    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => { slideAnterior(); reiniciarAutoRotacao(); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { proximoSlide(); reiniciarAutoRotacao(); });
    }

    if (slides.length > 1) {
      iniciarAutoRotacao();
      const carouselEl = document.getElementById('testimonialCarousel');
      carouselEl.addEventListener('mouseenter', pausarAutoRotacao);
      carouselEl.addEventListener('mouseleave', iniciarAutoRotacao);
    }
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal, .pulse-divider');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

});

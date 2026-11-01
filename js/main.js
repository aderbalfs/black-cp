/* ==========================================================================
   Operação Black CP — comportamento da página
   ========================================================================== */

/* ---- Configuração: edite aqui -------------------------------------------- */
const CONFIG = {
  // Link do grupo VIP no WhatsApp (botão exibido após o envio da ficha)
  linkGrupo: 'https://chat.whatsapp.com/L0WGWp68RRpFwC073zXnyM?s=cl&p=i&mlu=4&ilr=4&iam=2',

  // Data/hora de abertura da Black (horário de Brasília)
  dataAbertura: '2026-11-04T00:00:00-03:00',

  // Mostrar a barra do cronômetro no topo
  mostrarCronometro: true,

  // Endpoint que recebe o lead via POST (JSON). Ex.: webhook do CRM, Make, Zapier,
  // Google Apps Script. Deixe vazio para apenas simular o envio.
  webhookLead: ''
};

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = n => String(n).padStart(2, '0');

  const alvo = Date.parse(CONFIG.dataAbertura) || Date.parse('2026-11-04T00:00:00-03:00');

  /* ---- Data curta (DD/MM) ------------------------------------------------ */
  const d = new Date(alvo);
  $$('[data-bind="dataCurta"]').forEach(el => { el.textContent = pad(d.getDate()) + '/' + pad(d.getMonth() + 1); });

  /* ---- Número da ficha --------------------------------------------------- */
  $('#numero-ficha').textContent = String(1000 + Math.floor(Math.random() * 8999));

  /* ---- Cronômetro -------------------------------------------------------- */
  const timer = $('#timer');
  if (!CONFIG.mostrarCronometro) {
    timer.hidden = true;
  } else {
    const out = { d: $('#t-d'), h: $('#t-h'), m: $('#t-m'), s: $('#t-s') };
    const label = $('#timer-label');
    const tick = () => {
      let s = Math.max(0, Math.floor((alvo - Date.now()) / 1000));
      const dd = Math.floor(s / 86400); s %= 86400;
      const hh = Math.floor(s / 3600); s %= 3600;
      const mm = Math.floor(s / 60); s %= 60;
      out.d.textContent = pad(dd);
      out.h.textContent = pad(hh);
      out.m.textContent = pad(mm);
      out.s.textContent = pad(s);
      label.textContent = alvo <= Date.now()
        ? 'A Black CP está aberta. Corra para o grupo'
        : 'A Black CP abre em';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---- Formulário -------------------------------------------------------- */
  const form = $('#form-lead');
  const done = $('#form-done');
  const btn = $('#btn-enviar');
  const btnTxt = $('#btn-enviar-texto');
  const inputs = {
    nome: $('#nome'),
    whats: $('#whats'),
    email: $('#email'),
    concurso: $('#concurso'),
    aceite: $('#aceite')
  };

  $('#link-grupo').href = CONFIG.linkGrupo || 'https://chat.whatsapp.com/';

  const mascara = v => {
    const n = v.replace(/\D/g, '').slice(0, 11);
    if (n.length > 7) return '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);
    if (n.length > 2) return '(' + n.slice(0, 2) + ') ' + n.slice(2);
    return n;
  };

  const setErro = (campo, msg) => {
    const field = $('[data-field="' + campo + '"]', form);
    field.classList.toggle('has-error', Boolean(msg));
    $('.field__error', field).textContent = msg || '';
  };

  inputs.whats.addEventListener('input', e => { e.target.value = mascara(e.target.value); });

  Object.entries(inputs).forEach(([campo, el]) => {
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => setErro(campo, ''));
  });

  const validar = () => {
    const tel = inputs.whats.value.replace(/\D/g, '');
    const erros = {
      nome: inputs.nome.value.trim().length < 2 ? 'Escreva seu nome.' : '',
      whats: tel.length < 10 || tel.length > 11 ? 'Use DDD e número, por exemplo (81) 99999-9999.' : '',
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email.value.trim()) ? 'Confira o e-mail, falta alguma parte.' : '',
      concurso: !inputs.concurso.value ? 'Escolha uma opção.' : '',
      aceite: !inputs.aceite.checked ? 'Marque o aceite para continuar.' : ''
    };
    Object.entries(erros).forEach(([k, v]) => setErro(k, v));
    const primeiro = Object.keys(erros).find(k => erros[k]);
    if (primeiro) inputs[primeiro].focus();
    return !primeiro;
  };

  const enviarLead = async lead => {
    if (!CONFIG.webhookLead) {
      await new Promise(r => setTimeout(r, 700));
      return;
    }
    try {
      await fetch(CONFIG.webhookLead, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
    } catch (err) {
      console.error('Falha ao enviar lead:', err);
    }
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;

    btn.disabled = true;
    btnTxt.textContent = 'Enviando…';

    const nome = inputs.nome.value.trim();
    await enviarLead({
      nome,
      whatsapp: inputs.whats.value.replace(/\D/g, ''),
      email: inputs.email.value.trim(),
      concurso: inputs.concurso.value,
      origem: 'black-cp-2026',
      data: new Date().toISOString()
    });

    $('#done-title').textContent = 'Você está dentro, ' + (nome.split(' ')[0] || 'aluno');
    form.hidden = true;
    done.hidden = false;
  });

  /* ---- Botões "ir para o formulário" ------------------------------------ */
  const secaoForm = $('#inscricao');
  $$('[data-ir-para-form]').forEach(b => b.addEventListener('click', () => {
    window.scrollTo({ top: secaoForm.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
    setTimeout(() => { if (!form.hidden) inputs.nome.focus({ preventScroll: true }); }, 600);
  }));

  /* ---- Carrossel de aprovados ------------------------------------------- */
  const rail = $('#rail');
  $$('[data-rail]').forEach(b => b.addEventListener('click', () => {
    rail.scrollBy({ left: Number(b.dataset.rail) * 278, behavior: 'smooth' });
  }));

  /* ---- Imagens ausentes: placeholders ----------------------------------- */
  const quandoFalhar = (img, fn) => {
    if (img.complete && img.naturalWidth === 0) fn();
    else img.addEventListener('error', fn, { once: true });
  };

  // Fotos dos aprovados
  $$('.card__photo img').forEach(img => quandoFalhar(img, () => img.parentElement.classList.add('is-missing')));

  // Brasões
  $$('img[data-crest]').forEach(img => quandoFalhar(img, () => {
    const ph = document.createElement('span');
    ph.className = 'crest-missing' + (img.classList.contains('career__crest') ? '' : ' crest-missing--sm');
    ph.textContent = img.classList.contains('career__crest') ? img.dataset.crest : '';
    ph.setAttribute('aria-hidden', 'true');
    img.replaceWith(ph);
  }));
})();

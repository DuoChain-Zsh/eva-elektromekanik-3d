/* ==========================================================================
   EVA ELEKTROMEKANİK - APPLICATION INTERACTION & CPQ QUOTATION ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Substation Engine
  let substation3D = null;
  const canvasEl = document.getElementById('substationCanvas');
  if (canvasEl && window.Substation3DEngine) {
    substation3D = new Substation3DEngine('substationCanvas');
  }

  // 2. Audio Effects (Subtle tactile click synthesized with Web Audio API)
  let audioCtx = null;
  function playHoloSound(freq = 800, type = 'sine', duration = 0.04) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // 3. Explode Slider & Controls Sync
  const explodeSlider = document.getElementById('explodeSlider');
  const explodeValText = document.getElementById('explodeValText');

  if (explodeSlider && substation3D) {
    explodeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (explodeValText) explodeValText.textContent = `${Math.round(val * 100)}%`;
      substation3D.setExplode(val);
      playHoloSound(600 + val * 400, 'triangle', 0.02);
    });
  }

  // 4. View Mode Toggles (PBR / Light Cube / Wireframe)
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      if (substation3D) {
        substation3D.setViewMode(mode);
      }
      playHoloSound(1200, 'sine', 0.05);
      showToast(`Görünüm Modu: ${btn.textContent.trim()} aktif`);
    });
  });

  // 5. Hotspot Pills Quick Focus
  const hotspotPills = document.querySelectorAll('.hotspot-pill');
  hotspotPills.forEach(pill => {
    pill.addEventListener('click', () => {
      hotspotPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const spot = pill.getAttribute('data-spot');
      if (substation3D) {
        substation3D.focusHotspot(spot);
        if (explodeSlider) {
          explodeSlider.value = substation3D.targetExplodeFactor;
          if (explodeValText) {
            explodeValText.textContent = `${Math.round(substation3D.targetExplodeFactor * 100)}%`;
          }
        }
      }
      playHoloSound(950, 'sine', 0.06);
    });
  });

  // 6. Scroll-Driven Storytelling Animation
  // As user scrolls past the story steps, update 3D camera and explode factor
  const storySteps = document.querySelectorAll('.story-step');
  
  function checkScrollProgress() {
    if (!substation3D) return;

    const scrollY = window.scrollY;
    storySteps.forEach((step, idx) => {
      const rect = step.getBoundingClientRect();
      // When step is in the active reading zone
      if (rect.top <= window.innerHeight * 0.55 && rect.bottom >= window.innerHeight * 0.25) {
        step.classList.add('step-active');
        const factor = parseFloat(step.getAttribute('data-explode') || (idx * 0.25));
        const focusSpot = step.getAttribute('data-spot');
        
        // Update slider value display
        if (explodeSlider) {
          explodeSlider.value = factor;
          if (explodeValText) explodeValText.textContent = `${Math.round(factor * 100)}%`;
        }

        substation3D.setExplode(factor);
        if (focusSpot) {
          // Sync active hotspot pill
          hotspotPills.forEach(p => {
            if (p.getAttribute('data-spot') === focusSpot) {
              p.classList.add('active');
            } else {
              p.classList.remove('active');
            }
          });
        }
      }
    });
  }

  window.addEventListener('scroll', checkScrollProgress, { passive: true });

  // 7. Interactive CPQ & RFQ Köşk Konfigüratörü
  const configuratorState = {
    kioskType: 'monoblock', // 'monoblock', 'prefab', 'steel'
    trafoPower: '1600',     // '400', '630', '1000', '1600', '2500'
    cellConfig: 'standard', // 'standard', 'extended', 'ring', 'solar'
    options: {
      schneider: false,
      scada: true,
      fireSuppression: false,
      smartMeter: true
    }
  };

  const kioskData = {
    monoblock: {
      name: 'Monoblok Beton Köşk (EVA-MBK)',
      baseWeight: 18.5,
      dims: { 400: '2.5 x 4.8 x 2.6 m', 630: '2.5 x 5.4 x 2.6 m', 1000: '2.5 x 6.2 x 2.6 m', 1600: '2.5 x 7.2 x 2.6 m', 2500: '2.5 x 8.0 x 2.6 m' },
      tedasPrefix: 'TEDAŞ-MYD/96-32.B-MBK'
    },
    prefab: {
      name: 'Prefabrik Beton Köşk (EVA-PBK)',
      baseWeight: 24.0,
      dims: { 400: '3.0 x 6.0 x 3.2 m', 630: '3.0 x 7.2 x 3.2 m', 1000: '3.0 x 8.4 x 3.2 m', 1600: '3.2 x 9.6 x 3.2 m', 2500: '3.6 x 11.2 x 3.4 m' },
      tedasPrefix: 'TEDAŞ-MYD/PBK-MOD'
    },
    steel: {
      name: 'Kompakt Sac Köşk (EVA-SAC)',
      baseWeight: 6.8,
      dims: { 400: '2.2 x 4.2 x 2.4 m', 630: '2.2 x 4.8 x 2.4 m', 1000: '2.2 x 5.6 x 2.4 m', 1600: '2.4 x 6.4 x 2.4 m', 2500: '2.4 x 7.4 x 2.5 m' },
      tedasPrefix: 'EVA-SAC-COMPACT'
    }
  };

  const cellConfigData = {
    standard: {
      title: 'Standart Trafo Koruma (2 Giriş + 1 Trafo)',
      cells: '2x EVA-GÇ (Yük Ayırıcılı Giriş) + 1x EVA-K (Kesicili Trafo Koruma)',
      cellWeight: 1.2
    },
    extended: {
      title: 'Genişletilmiş Dağıtım (3 Giriş + 1 Trafo + 1 Ölçü)',
      cells: '3x EVA-GÇ + 1x EVA-K + 1x EVA-Ö (Gerilim Ölçü)',
      cellWeight: 1.9
    },
    ring: {
      title: 'Ring Ana Dağıtım Merkezi (4 Hücreli LSC2B-PM)',
      cells: '2x EVA-K (Giriş Kesicili) + 1x EVA-K (Trafo) + 1x EVA-KP (Kuplaj)',
      cellWeight: 2.3
    },
    solar: {
      title: 'Güneş & RES Santral Paketi (Çift Trafo & Kuplaj)',
      cells: '2x EVA-K (Giriş) + 2x EVA-K (Trafo) + 1x EVA-Ö + 1x EVA-KP',
      cellWeight: 2.8
    }
  };

  function updateConfiguratorSummary() {
    const kType = kioskData[configuratorState.kioskType];
    const power = configuratorState.trafoPower;
    const cellConf = cellConfigData[configuratorState.cellConfig];

    const modelCode = `EVA-${configuratorState.kioskType === 'monoblock' ? 'MBK' : configuratorState.kioskType === 'prefab' ? 'PBK' : 'SAC'}-36kV-${power}kVA-${configuratorState.cellConfig.toUpperCase()}`;
    const dims = kType.dims[power] || '2.5 x 7.2 x 2.6 m';
    
    // Weight calculation
    const trafoWeight = (parseInt(power) * 0.0028).toFixed(1);
    const totalWeight = (kType.baseWeight + parseFloat(trafoWeight) + cellConf.cellWeight).toFixed(1);

    // Update DOM Elements
    const codeEl = document.getElementById('cfgModelCode');
    const typeEl = document.getElementById('cfgKioskName');
    const powerEl = document.getElementById('cfgPowerVal');
    const cellsEl = document.getElementById('cfgCellsVal');
    const dimsEl = document.getElementById('cfgDimsVal');
    const weightEl = document.getElementById('cfgWeightVal');
    const deliveryEl = document.getElementById('cfgDeliveryVal');

    if (codeEl) codeEl.textContent = modelCode;
    if (typeEl) typeEl.textContent = kType.name;
    if (powerEl) powerEl.textContent = `${power} kVA (36 kV / 0.4 kV)`;
    if (cellsEl) cellsEl.textContent = cellConf.cells;
    if (dimsEl) dimsEl.textContent = dims;
    if (weightEl) weightEl.textContent = `~${totalWeight} Ton`;
    if (deliveryEl) deliveryEl.textContent = configuratorState.kioskType === 'monoblock' ? '14-21 İş Günü' : '21-28 İş Günü';
  }

  // Handle Option Clicks
  const configOptionButtons = document.querySelectorAll('.config-option-btn');
  configOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-group');
      const value = btn.getAttribute('data-value');

      if (group === 'kiosk') {
        configuratorState.kioskType = value;
      } else if (group === 'power') {
        configuratorState.trafoPower = value;
      } else if (group === 'cells') {
        configuratorState.cellConfig = value;
      } else if (group === 'option') {
        configuratorState.options[value] = !configuratorState.options[value];
        btn.classList.toggle('selected');
        playHoloSound(1100, 'sine', 0.04);
        updateConfiguratorSummary();
        return;
      }

      // Single select inside group
      document.querySelectorAll(`.config-option-btn[data-group="${group}"]`).forEach(b => {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');

      playHoloSound(900, 'sine', 0.04);
      updateConfiguratorSummary();
    });
  });

  // 8. RFQ Modal Open & Close
  const quoteModal = document.getElementById('quoteModal');
  const openQuoteButtons = document.querySelectorAll('.trigger-quote-modal');
  const closeQuoteButton = document.getElementById('closeQuoteModal');

  openQuoteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (quoteModal) {
        quoteModal.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Pre-fill modal with current configurator choice
        const modalConfigInput = document.getElementById('modalSelectedConfig');
        const codeEl = document.getElementById('cfgModelCode');
        if (modalConfigInput && codeEl) {
          modalConfigInput.value = codeEl.textContent;
        }
        playHoloSound(1000, 'sine', 0.08);
      }
    });
  });

  if (closeQuoteButton && quoteModal) {
    closeQuoteButton.addEventListener('click', () => {
      quoteModal.classList.remove('open');
      document.body.style.overflow = '';
      playHoloSound(600, 'sine', 0.05);
    });

    quoteModal.addEventListener('click', (e) => {
      if (e.target === quoteModal) {
        quoteModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // 9. WhatsApp Immediate Quote Link
  const whatsappQuoteBtn = document.getElementById('whatsappQuoteBtn');
  if (whatsappQuoteBtn) {
    whatsappQuoteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const code = document.getElementById('cfgModelCode')?.textContent || 'EVA-MBK-36kV';
      const power = configuratorState.trafoPower;
      const kiosk = kioskData[configuratorState.kioskType].name;
      const cells = cellConfigData[configuratorState.cellConfig].cells;

      const message = `Merhaba EVA Elektromekanik Mühendislik Ekibi,%0A%0AWeb sitenizdeki 3D Konfigüratör üzerinden aşağıdaki köşk ve şalt sistemi için resmi fiyat teklifi ve teknik şartname talep ediyorum:%0A%0A📌 *Model Kodu:* ${code}%0A🏢 *Köşk Tipi:* ${kiosk}%0A⚡ *Trafo Gücü:* ${power} kVA (36 kV / 0.4 kV)%0A🔌 *Hücre Kombinasyonu:* ${cells}%0A%0ALütfen tarafıma dönüş sağlayınız.`;
      
      const whatsappUrl = `https://wa.me/905320000000?text=${message}`;
      window.open(whatsappUrl, '_blank');
      showToast('WhatsApp mühendislik hattına yönlendiriliyorsunuz...');
    });
  }

  // 10. Quote Form Submission
  const quoteForm = document.getElementById('rfqForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
          Teklif Hazırlanıyor...
        `;
      }

      setTimeout(() => {
        if (quoteModal) quoteModal.classList.remove('open');
        document.body.style.overflow = '';
        quoteForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Teklif Talebini Gönder';
        }
        showToast('Talebiniz alındı! Mühendis ekibimiz 24 saat içinde resmi teklifinizi iletecektir.', 'success');
        playHoloSound(1400, 'sine', 0.15);
      }, 1200);
    });
  }

  // 11. Toast Notifications Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${type === 'success' ? '#10B981' : '#00F2FE'}" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Initial update
  updateConfiguratorSummary();
});

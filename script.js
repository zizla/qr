/**
 * QR Studio - Pure Vanilla JavaScript Logic
 * Serverless / Offline / file:/// protocol compatible
 */

(function () {
  'use strict';

  // --- 전역 상태 및 DOM 캐시 ---
  const state = {
    currentTab: 'url',
    qrColorDark: '#0f172a',
    qrColorLight: '#ffffff',
    qrSize: 320,
    qrMargin: 20,
    ecl: 'H', // L, M, Q, H
    logoPreset: 'none', // none, link, globe, wifi, star, custom
    customLogoImg: null,
    customLogoName: '',
    autoUpdate: true,
    lastContent: '',
  };

  // DOM 요소 캐시
  const elements = {
    // 탭 버튼 및 패널
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // 입력 요소
    urlInput: document.getElementById('url-input'),
    btnPasteUrl: document.getElementById('btn-paste-url'),
    btnClearUrl: document.getElementById('btn-clear-url'),
    chipBtns: document.querySelectorAll('.chip-btn'),
    
    textInput: document.getElementById('text-input'),
    
    wifiSsid: document.getElementById('wifi-ssid'),
    wifiAuth: document.getElementById('wifi-auth'),
    wifiPass: document.getElementById('wifi-pass'),
    wifiPassGroup: document.getElementById('wifi-pass-group'),
    
    vcardName: document.getElementById('vcard-name'),
    vcardPhone: document.getElementById('vcard-phone'),
    vcardEmail: document.getElementById('vcard-email'),
    vcardOrg: document.getElementById('vcard-org'),

    // 커스텀 컨트롤
    colorDarkInput: document.getElementById('qr-color-dark'),
    colorLightInput: document.getElementById('qr-color-light'),
    hexDarkSpan: document.getElementById('hex-dark'),
    hexLightSpan: document.getElementById('hex-light'),
    themePresets: document.querySelectorAll('.theme-preset-btn'),
    
    sizeSlider: document.getElementById('qr-size-slider'),
    sizeValue: document.getElementById('qr-size-val'),
    marginSlider: document.getElementById('qr-margin-slider'),
    marginValue: document.getElementById('qr-margin-val'),
    
    eclSelect: document.getElementById('error-correction'),
    
    // 로고 관련 신규 UI 요소
    logoChipBtns: document.querySelectorAll('.logo-chip-btn'),
    btnTriggerUpload: document.getElementById('btn-trigger-upload'),
    customLogoInput: document.getElementById('custom-logo-input'),
    uploadedLogoPreview: document.getElementById('uploaded-logo-preview'),
    logoPreviewThumb: document.getElementById('logo-preview-thumb'),
    logoFileName: document.getElementById('logo-file-name'),
    btnRemoveLogo: document.getElementById('btn-remove-logo'),
    logoStatusHint: document.getElementById('logo-status-hint'),
    
    btnGenerate: document.getElementById('btn-generate'),
    autoUpdateCheck: document.getElementById('auto-update-check'),
    
    // 프리뷰 및 요약
    qrcodeBox: document.getElementById('qrcode-box'),
    summaryType: document.getElementById('summary-type-tag'),
    summaryCharCount: document.getElementById('summary-char-count'),
    summaryDisplay: document.getElementById('summary-text-display'),
    currentEclLabel: document.getElementById('current-ecl-label'),
    btnZoomQr: document.getElementById('btn-zoom-qr'),
    
    // 내보내기 버튼들
    btnDownloadPng: document.getElementById('btn-download-png'),
    btnDownload2x: document.getElementById('btn-download-2x'),
    btnCopyImage: document.getElementById('btn-copy-image'),
    btnPrintQr: document.getElementById('btn-print-qr'),
    
    // 히스토리
    historyContainer: document.getElementById('history-items-container'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    
    // 모달 & 토스트
    zoomModal: document.getElementById('zoom-modal'),
    modalBody: document.getElementById('modal-qr-target'),
    modalInfoText: document.getElementById('modal-info-text'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    toastContainer: document.getElementById('toast-container'),
  };

  // 내장 SVG 아이콘 벡터 패스 (로고 합성용)
  const ICON_SVGS = {
    link: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    globe: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
  };

  // 캐시된 프리셋 Image 객체
  const presetImageCache = {};
  function preloadPresetIcons() {
    Object.keys(ICON_SVGS).forEach(key => {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ICON_SVGS[key])}`;
      presetImageCache[key] = img;
    });
  }
  preloadPresetIcons();

  // --- 토스트 알림 함수 ---
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3200);
  }

  // --- 복원력 매핑 ---
  function getQRCodeCorrectLevel(levelChar) {
    if (typeof QRCode === 'undefined' || !QRCode.CorrectLevel) {
      return 2; // H fallback
    }
    switch (levelChar) {
      case 'L': return QRCode.CorrectLevel.L;
      case 'M': return QRCode.CorrectLevel.M;
      case 'Q': return QRCode.CorrectLevel.Q;
      case 'H':
      default: return QRCode.CorrectLevel.H;
    }
  }

  // --- 현재 탭에 따른 컨텐츠 취합 ---
  function getCurrentContent() {
    let content = '';
    let typeName = 'URL';

    switch (state.currentTab) {
      case 'url': {
        let val = (elements.urlInput.value || '').trim();
        if (val && !/^https?:\/\//i.test(val) && !/^mailto:/i.test(val) && !/^tel:/i.test(val)) {
          val = 'https://' + val;
        }
        content = val || 'https://google.com';
        typeName = '웹사이트 URL';
        break;
      }
      case 'text': {
        content = (elements.textInput.value || '').trim() || '텍스트를 입력해주세요';
        typeName = '일반 텍스트';
        break;
      }
      case 'wifi': {
        const ssid = (elements.wifiSsid.value || '').trim() || 'MyWiFi';
        const auth = elements.wifiAuth.value;
        const pass = (elements.wifiPass.value || '').trim();
        const escapedSsid = ssid.replace(/([\\;,:"])/g, '\\$1');
        const escapedPass = pass.replace(/([\\;,:"])/g, '\\$1');
        content = `WIFI:T:${auth};S:${escapedSsid};P:${escapedPass};;`;
        typeName = `Wi-Fi (${ssid})`;
        break;
      }
      case 'vcard': {
        const name = (elements.vcardName.value || '').trim() || '홍길동';
        const phone = (elements.vcardPhone.value || '').trim();
        const email = (elements.vcardEmail.value || '').trim();
        const org = (elements.vcardOrg.value || '').trim();
        
        content = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${name}`,
          `N:${name};;;;`,
          phone ? `TEL;TYPE=CELL:${phone}` : '',
          email ? `EMAIL:${email}` : '',
          org ? `ORG:${org}` : '',
          'END:VCARD'
        ].filter(Boolean).join('\n');
        
        typeName = `연락처 (${name})`;
        break;
      }
      default:
        content = elements.urlInput.value || 'https://google.com';
        typeName = 'URL';
    }

    return { content, typeName };
  }

  // --- 핵심: 합성 캔버스 생성 (QR + 패딩 여백 + 중앙 로고) ---
  function renderCompositeQRCode(rawCanvas, targetWidth, targetMargin, logoOption, customImg) {
    const totalSize = targetWidth + (targetMargin * 2);
    
    // 메인 출력용 캔버스 생성
    const compCanvas = document.createElement('canvas');
    compCanvas.width = totalSize;
    compCanvas.height = totalSize;
    const ctx = compCanvas.getContext('2d');

    // 1. 배경 채우기
    ctx.fillStyle = state.qrColorLight;
    ctx.fillRect(0, 0, totalSize, totalSize);

    // 2. QR 코드 본체 그리기 (여백 적용)
    ctx.drawImage(rawCanvas, targetMargin, targetMargin, targetWidth, targetWidth);

    // 3. 중앙 로고 그리기 (선택되었을 경우)
    if (logoOption && logoOption !== 'none') {
      const logoBoxSize = Math.floor(targetWidth * 0.24); // QR 크기의 약 24%
      const logoX = Math.floor((totalSize - logoBoxSize) / 2);
      const logoY = Math.floor((totalSize - logoBoxSize) / 2);
      const radius = Math.floor(logoBoxSize * 0.22); // 둥근 모서리

      // 로고 뒷배경 흰색 둥근 사각형 베이스
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(logoX + radius, logoY);
      ctx.lineTo(logoX + logoBoxSize - radius, logoY);
      ctx.quadraticCurveTo(logoX + logoBoxSize, logoY, logoX + logoBoxSize, logoY + radius);
      ctx.lineTo(logoX + logoBoxSize, logoY + logoBoxSize - radius);
      ctx.quadraticCurveTo(logoX + logoBoxSize, logoY + logoBoxSize, logoX + logoBoxSize - radius, logoY + logoBoxSize);
      ctx.lineTo(logoX + radius, logoY + logoBoxSize);
      ctx.quadraticCurveTo(logoX, logoY + logoBoxSize, logoX, logoY + logoBoxSize - radius);
      ctx.lineTo(logoX, logoY + radius);
      ctx.quadraticCurveTo(logoX, logoY, logoX + radius, logoY);
      ctx.closePath();

      // 그림자 및 배경 채우기
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.restore();

      // 내부 이미지/아이콘 렌더링 영역
      const innerPadding = Math.floor(logoBoxSize * 0.14);
      const innerSize = logoBoxSize - (innerPadding * 2);
      const innerX = logoX + innerPadding;
      const innerY = logoY + innerPadding;

      if (logoOption === 'custom' && customImg) {
        try {
          const imgW = customImg.naturalWidth || customImg.width || innerSize;
          const imgH = customImg.naturalHeight || customImg.height || innerSize;
          
          // 비율 유지 (Aspect Ratio Contain)
          const aspect = imgW / imgH;
          let drawW = innerSize;
          let drawH = innerSize;
          if (aspect > 1) {
            drawH = innerSize / aspect;
          } else {
            drawW = innerSize * aspect;
          }
          const drawX = innerX + (innerSize - drawW) / 2;
          const drawY = innerY + (innerSize - drawH) / 2;

          ctx.drawImage(customImg, drawX, drawY, drawW, drawH);
        } catch (drawErr) {
          console.warn('Custom logo draw error:', drawErr);
        }
      } else if (presetImageCache[logoOption]) {
        const pImg = presetImageCache[logoOption];
        if (pImg.complete) {
          ctx.drawImage(pImg, innerX, innerY, innerSize, innerSize);
        } else {
          pImg.onload = () => {
            ctx.drawImage(pImg, innerX, innerY, innerSize, innerSize);
          };
        }
      }
    }

    return compCanvas;
  }

  // --- QR 코드 메인 생성 함수 ---
  let isGenerating = false;
  function generateQRCode(saveToHistory = true) {
    if (isGenerating) return;
    if (typeof QRCode === 'undefined') {
      showToast('QR 라이브러리가 로드되지 않았습니다.', 'info');
      return;
    }

    isGenerating = true;

    try {
      const { content, typeName } = getCurrentContent();
      state.lastContent = content;

      // 요약 UI 업데이트
      elements.summaryType.textContent = typeName;
      elements.summaryCharCount.textContent = `${content.length}자`;
      elements.summaryDisplay.textContent = content.replace(/\n/g, ' ↵ ');

      // 로고가 있을 경우 ECL을 자동으로 H로 올려줌 (안정적 스캔 보장)
      if (state.logoPreset !== 'none' && state.ecl !== 'H') {
        state.ecl = 'H';
        elements.eclSelect.value = 'H';
      }

      // ECL 라벨 업데이트
      const eclNames = { L: 'Low (7%)', M: 'Medium (15%)', Q: 'Quartile (25%)', H: 'High (30%)' };
      elements.currentEclLabel.textContent = `복원율: ${eclNames[state.ecl] || state.ecl}`;

      // 임시 오프스크린 컨테이너에서 QRCode.js 실행
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      new QRCode(tempDiv, {
        text: content,
        width: state.qrSize,
        height: state.qrSize,
        colorDark: state.qrColorDark,
        colorLight: state.qrColorLight,
        correctLevel: getQRCodeCorrectLevel(state.ecl),
      });

      setTimeout(() => {
        let rawCanvas = tempDiv.querySelector('canvas');
        if (!rawCanvas) {
          const rawImg = tempDiv.querySelector('img');
          if (rawImg && rawImg.src) {
            rawCanvas = document.createElement('canvas');
            rawCanvas.width = state.qrSize;
            rawCanvas.height = state.qrSize;
            const cCtx = rawCanvas.getContext('2d');
            cCtx.drawImage(rawImg, 0, 0, state.qrSize, state.qrSize);
          }
        }

        if (rawCanvas) {
          const finalCanvas = renderCompositeQRCode(
            rawCanvas,
            state.qrSize,
            state.qrMargin,
            state.logoPreset,
            state.customLogoImg
          );

          elements.qrcodeBox.innerHTML = '';
          elements.qrcodeBox.appendChild(finalCanvas);

          if (saveToHistory && content && content.length > 0) {
            saveHistoryItem(content, typeName);
          }
        }

        if (tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
        }
        isGenerating = false;
      }, 50);

    } catch (err) {
      console.error('QR Generation Error:', err);
      showToast(`QR 코드 생성 오류: ${err.message || '알 수 없는 에러'}`, 'info');
      isGenerating = false;
    }
  }

  // 디바운스 래퍼
  let debounceTimer = null;
  function triggerUpdate(saveHistory = false) {
    if (!state.autoUpdate && !saveHistory) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      generateQRCode(saveHistory);
    }, 180);
  }

  // --- 히스토리 관리 (LocalStorage) ---
  const STORAGE_KEY = 'qr_studio_history_v1';
  function getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistoryItem(text, type) {
    try {
      let list = getHistory();
      if (list.length > 0 && list[0].text === text) return;
      
      list = list.filter(item => item.text !== text);
      list.unshift({
        text,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      });

      if (list.length > 6) list = list.slice(0, 6);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      renderHistoryList();
    } catch (e) {
      // ignore
    }
  }

  function renderHistoryList() {
    const list = getHistory();
    if (!elements.historyContainer) return;

    if (list.length === 0) {
      elements.historyContainer.innerHTML = `<p class="empty-history-text">생성된 QR 코드가 여기에 자동 저장됩니다.</p>`;
      return;
    }

    elements.historyContainer.innerHTML = '';
    list.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-info">
          <span class="history-type-badge">${item.type}</span>
          <span class="history-text" title="${item.text}">${item.text}</span>
        </div>
        <span class="history-time">${item.time}</span>
      `;
      div.addEventListener('click', () => {
        if (item.type.includes('URL') || item.text.startsWith('http')) {
          switchTab('url');
          elements.urlInput.value = item.text;
        } else if (item.type.includes('Wi-Fi')) {
          switchTab('wifi');
        } else if (item.type.includes('연락처')) {
          switchTab('vcard');
        } else {
          switchTab('text');
          elements.textInput.value = item.text;
        }
        generateQRCode(false);
        showToast('이전 생성 기록을 불러왔습니다.', 'info');
      });
      elements.historyContainer.appendChild(div);
    });
  }

  // --- 탭 전환 로직 ---
  function switchTab(tabId) {
    state.currentTab = tabId;
    elements.tabBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    elements.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabId}`);
    });

    triggerUpdate(false);
  }

  // --- 이벤트 리스너 바인딩 ---
  function initEventListeners() {
    // 탭 클릭
    elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // 입력 필드 변경 감지
    const inputsToWatch = [
      elements.urlInput,
      elements.textInput,
      elements.wifiSsid,
      elements.wifiPass,
      elements.vcardName,
      elements.vcardPhone,
      elements.vcardEmail,
      elements.vcardOrg
    ];

    inputsToWatch.forEach(input => {
      if (input) {
        input.addEventListener('input', () => triggerUpdate(false));
        input.addEventListener('change', () => triggerUpdate(true));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            generateQRCode(true);
            showToast('QR 코드가 새로고침되었습니다.', 'success');
          }
        });
      }
    });

    // Wi-Fi 보안 종류 변경 시 비밀번호 필드 토글
    elements.wifiAuth.addEventListener('change', (e) => {
      if (e.target.value === 'nopass') {
        elements.wifiPassGroup.style.display = 'none';
      } else {
        elements.wifiPassGroup.style.display = 'flex';
      }
      triggerUpdate(false);
    });

    // 붙여넣기 버튼
    elements.btnPasteUrl.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            elements.urlInput.value = text;
            triggerUpdate(true);
            showToast('클립보드 내용을 붙여넣었습니다.', 'success');
          }
        } else {
          showToast('Ctrl+V를 눌러 주소창에 직접 붙여넣으실 수 있습니다.', 'info');
        }
      } catch (err) {
        showToast('Ctrl+V를 눌러 직접 붙여넣으실 수 있습니다.', 'info');
      }
    });

    // 지우기 버튼
    elements.btnClearUrl.addEventListener('click', () => {
      elements.urlInput.value = '';
      elements.urlInput.focus();
      triggerUpdate(false);
    });

    // 빠른 링크 칩 클릭
    elements.chipBtns.forEach(chip => {
      chip.addEventListener('click', () => {
        const url = chip.getAttribute('data-url');
        elements.urlInput.value = url;
        switchTab('url');
        generateQRCode(true);
        showToast(`'${chip.textContent}' URL이 적용되었습니다.`, 'success');
      });
    });

    // 색상 피커
    elements.colorDarkInput.addEventListener('input', (e) => {
      state.qrColorDark = e.target.value;
      elements.hexDarkSpan.textContent = e.target.value.toUpperCase();
      elements.themePresets.forEach(b => b.classList.remove('active'));
      triggerUpdate(false);
    });

    elements.colorLightInput.addEventListener('input', (e) => {
      state.qrColorLight = e.target.value;
      elements.hexLightSpan.textContent = e.target.value.toUpperCase();
      elements.themePresets.forEach(b => b.classList.remove('active'));
      triggerUpdate(false);
    });

    // 테마 프리셋 버튼
    elements.themePresets.forEach(presetBtn => {
      presetBtn.addEventListener('click', () => {
        elements.themePresets.forEach(b => b.classList.remove('active'));
        presetBtn.classList.add('active');

        const dark = presetBtn.getAttribute('data-dark');
        const light = presetBtn.getAttribute('data-light');

        state.qrColorDark = dark;
        state.qrColorLight = light;

        elements.colorDarkInput.value = dark;
        elements.colorLightInput.value = light;
        elements.hexDarkSpan.textContent = dark.toUpperCase();
        elements.hexLightSpan.textContent = light.toUpperCase();

        generateQRCode(false);
      });
    });

    // 크기 슬라이더
    elements.sizeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.qrSize = val;
      elements.sizeValue.textContent = `${val} px`;
      triggerUpdate(false);
    });

    // 여백 슬라이더
    elements.marginSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.qrMargin = val;
      elements.marginValue.textContent = `${val} px`;
      triggerUpdate(false);
    });

    // 오류 복원율 셀렉트
    elements.eclSelect.addEventListener('change', (e) => {
      state.ecl = e.target.value;
      generateQRCode(false);
    });

    // ==========================================================================
    // 로고 컨트롤 (프리셋 칩 & 커스텀 이미지 업로드)
    // ==========================================================================

    // 1. 프리셋 칩 클릭
    elements.logoChipBtns.forEach(chip => {
      chip.addEventListener('click', () => {
        const logoType = chip.getAttribute('data-logo');
        
        elements.logoChipBtns.forEach(b => b.classList.remove('active'));
        chip.classList.add('active');

        // 커스텀 로고 상태 해제
        state.logoPreset = logoType;
        if (logoType !== 'custom') {
          elements.uploadedLogoPreview.style.display = 'none';
          elements.btnTriggerUpload.style.display = 'flex';
          elements.logoStatusHint.textContent = logoType === 'none' ? '권장: 정방형 PNG' : '프리셋 아이콘 적용됨';
        }

        // 복원율을 High(30%)로 자동 상향
        if (logoType !== 'none') {
          state.ecl = 'H';
          elements.eclSelect.value = 'H';
        }

        generateQRCode(false);
      });
    });

    // 2. 업로드 버튼 클릭 시 파일 선택창 열기
    elements.btnTriggerUpload.addEventListener('click', () => {
      // input value를 리셋하여 동일 파일을 다시 선택해도 이벤트 발생 보장
      elements.customLogoInput.value = '';
      elements.customLogoInput.click();
    });

    // 3. 파일 선택 완료 처리
    elements.customLogoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        showToast('이미지 파일(PNG, JPG, SVG, WebP)만 선택해주세요.', 'info');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        showToast('이미지 파일 크기는 10MB 이하만 가능합니다.', 'info');
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        showToast('파일을 읽는 도중 오류가 발생했습니다.', 'info');
      };

      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target.result;
        const img = new Image();

        img.onerror = () => {
          showToast('이미지를 로드할 수 없습니다. 다른 이미지를 시도해주세요.', 'info');
        };

        img.onload = () => {
          state.customLogoImg = img;
          state.customLogoName = file.name;
          state.logoPreset = 'custom';

          // 프리셋 칩 활성 해제
          elements.logoChipBtns.forEach(b => b.classList.remove('active'));

          // 업로드 미리보기 UI 활성화
          elements.logoPreviewThumb.src = dataUrl;
          elements.logoFileName.textContent = file.name;
          elements.uploadedLogoPreview.style.display = 'flex';
          elements.btnTriggerUpload.style.display = 'none';
          elements.logoStatusHint.textContent = '내 로고 적용됨 (ECL 30%)';

          // 로고 인식률을 위해 복원율을 자동으로 High(30%)로 설정
          state.ecl = 'H';
          elements.eclSelect.value = 'H';

          generateQRCode(false);
          showToast('로고 이미지가 성공적으로 적용되었습니다!', 'success');
        };

        img.src = dataUrl;
      };

      reader.readAsDataURL(file);
    });

    // 4. 로고 제거 버튼
    elements.btnRemoveLogo.addEventListener('click', (e) => {
      e.stopPropagation();
      state.customLogoImg = null;
      state.customLogoName = '';
      state.logoPreset = 'none';

      elements.uploadedLogoPreview.style.display = 'none';
      elements.btnTriggerUpload.style.display = 'flex';
      elements.customLogoInput.value = '';
      elements.logoStatusHint.textContent = '권장: 정방형 PNG';

      // '없음' 칩 활성화
      elements.logoChipBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-logo') === 'none');
      });

      generateQRCode(false);
      showToast('로고가 제거되었습니다.', 'info');
    });

    // 새로고침 생성 버튼
    elements.btnGenerate.addEventListener('click', () => {
      generateQRCode(true);
      showToast('QR 코드가 새로고침되었습니다.', 'success');
    });

    // 실시간 자동 반영 체크박스
    elements.autoUpdateCheck.addEventListener('change', (e) => {
      state.autoUpdate = e.target.checked;
      if (state.autoUpdate) {
        generateQRCode(false);
      }
    });

    // --- 다운로드 & 클립보드 복사 로직 ---
    elements.btnDownloadPng.addEventListener('click', () => {
      downloadCanvasImage(1, 'qr-code.png');
    });

    elements.btnDownload2x.addEventListener('click', () => {
      downloadCanvasImage(2, 'qr-code-2x-uhd.png');
    });

    function downloadCanvasImage(scale = 1, filename = 'qr-code.png') {
      const currentCanvas = elements.qrcodeBox.querySelector('canvas');
      if (!currentCanvas) {
        showToast('다운로드할 QR 코드가 없습니다.', 'info');
        return;
      }

      let exportCanvas = currentCanvas;
      if (scale > 1) {
        exportCanvas = document.createElement('canvas');
        exportCanvas.width = currentCanvas.width * scale;
        exportCanvas.height = currentCanvas.height * scale;
        const ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(currentCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
      }

      try {
        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`'${filename}' 다운로드가 시작되었습니다.`, 'success');
      } catch (err) {
        console.error('Download error:', err);
        showToast('다운로드 중 오류가 발생했습니다.', 'info');
      }
    }

    // 클립보드 복사
    elements.btnCopyImage.addEventListener('click', async () => {
      const canvas = elements.qrcodeBox.querySelector('canvas');
      if (!canvas) return;

      if (navigator.clipboard && window.ClipboardItem && canvas.toBlob) {
        try {
          canvas.toBlob(async (blob) => {
            if (!blob) {
              showToast('이미지 변환에 실패했습니다.', 'info');
              return;
            }
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('클립보드에 이미지가 복사되었습니다!', 'success');
          }, 'image/png');
        } catch (err) {
          console.warn('Clipboard write failed:', err);
          showToast('이미지 우클릭 > [이미지 복사]를 이용해주세요.', 'info');
        }
      } else {
        showToast('이미지 우클릭 > [이미지 복사]를 이용해주세요.', 'info');
      }
    });

    // 인쇄
    elements.btnPrintQr.addEventListener('click', () => {
      window.print();
    });

    // 확대 모달
    elements.btnZoomQr.addEventListener('click', () => {
      const currentCanvas = elements.qrcodeBox.querySelector('canvas');
      if (!currentCanvas) return;

      elements.modalBody.innerHTML = '';
      const cloneCanvas = document.createElement('canvas');
      cloneCanvas.width = currentCanvas.width;
      cloneCanvas.height = currentCanvas.height;
      const ctx = cloneCanvas.getContext('2d');
      ctx.drawImage(currentCanvas, 0, 0);
      cloneCanvas.style.maxWidth = '100%';
      cloneCanvas.style.height = 'auto';

      elements.modalBody.appendChild(cloneCanvas);
      elements.modalInfoText.textContent = state.lastContent;
      elements.zoomModal.classList.add('active');
    });

    elements.btnCloseModal.addEventListener('click', () => {
      elements.zoomModal.classList.remove('active');
    });

    elements.zoomModal.addEventListener('click', (e) => {
      if (e.target === elements.zoomModal) {
        elements.zoomModal.classList.remove('active');
      }
    });

    // 히스토리 초기화
    elements.btnClearHistory.addEventListener('click', () => {
      if (confirm('최근 생성 기록을 모두 지우시겠습니까?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistoryList();
        showToast('생성 기록이 삭제되었습니다.', 'info');
      }
    });
  }

  // --- 초기 실행 ---
  function init() {
    initEventListeners();
    renderHistoryList();

    // 초기 QR 코드 렌더링
    generateQRCode(false);

    // 준비 완료 토스트
    setTimeout(() => {
      showToast('QR Studio가 준비되었습니다.', 'success');
    }, 300);
  }

  // DOM 로드 완료 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

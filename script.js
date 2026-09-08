
console.log(
  "%c Crafted with precision by Nikhil Gupta %c 🚀 Pure Client-Side Engine",
  "background: #6366f1; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold;",
  "background: #0f172a; color: #06b6d4; padding: 6px 12px; border-radius: 4px;"
);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Elements Selection
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const controlsSection = document.getElementById('controlsSection');
  const qualityRange = document.getElementById('qualityRange');
  const qualityVal = document.getElementById('qualityVal');
  const targetKbInput = document.getElementById('targetKbInput');
  const compressBtn = document.getElementById('compressBtn');

  // Results & Slider Elements
  const resultSection = document.getElementById('resultSection');
  const comparisonSlider = document.getElementById('comparisonSlider');
  const afterWrapper = document.getElementById('afterWrapper');
  const sliderHandle = document.getElementById('sliderHandle');
  const beforeImg = document.getElementById('beforeImg');
  const afterImg = document.getElementById('afterImg');
  const originalSizeText = document.getElementById('originalSize');
  const compressedSizeText = document.getElementById('compressedSize');
  const downloadBtn = document.getElementById('downloadBtn');

  // Coffee Modal Elements
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const coffeeModal = document.getElementById('coffeeModal');
  const copyUpiBtn = document.getElementById('copyUpiBtn');
  const upiText = document.getElementById('upiText');

  let currentFile = null;
  let originalDataUrl = null;
  let isDragging = false;

  // ----------------------------------------------------
  // 📁 FILE UPLOAD LOGIC
  // ----------------------------------------------------
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#6366f1';
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('कृपया केवल इमेज फ़ाइल अपलोड करें!');
      return;
    }
    currentFile = file;
    if (originalSizeText) originalSizeText.textContent = formatBytes(file.size);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      originalDataUrl = e.target.result;
      if (beforeImg) beforeImg.src = originalDataUrl;
    };

    if (controlsSection) controlsSection.style.display = 'block';
    if (resultSection) resultSection.style.display = 'none';
  }

  // ----------------------------------------------------
  // 🎚️ QUALITY SLIDER DISPLAY
  // ----------------------------------------------------
  if (qualityRange && qualityVal) {
    qualityRange.addEventListener('input', (e) => {
      qualityVal.textContent = `${e.target.value}%`;
    });
  }

  // ----------------------------------------------------
  // ⚡ COMPRESSION LOGIC (SLIDER + TARGET KB)
  // ----------------------------------------------------
  if (compressBtn) {
    compressBtn.addEventListener('click', () => {
      if (!currentFile || !originalDataUrl) return;

      const originalBtnText = compressBtn.innerHTML;
      compressBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
      compressBtn.disabled = true;

      const img = new Image();
      img.src = originalDataUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        let compressedDataUrl = '';
        const targetKb = targetKbInput ? parseFloat(targetKbInput.value) : null;

        // अगर यूजर ने Target KB डाला है
        if (targetKb && targetKb > 0) {
          const targetBytes = targetKb * 1024;
          let minQ = 0.05;
          let maxQ = 0.95;
          let bestDataUrl = canvas.toDataURL('image/jpeg', minQ);

          // Binary Search: 6 स्टेप्स में सबसे सटीक क्वालिटी
          for (let i = 0; i < 6; i++) {
            const midQ = (minQ + maxQ) / 2;
            const testUrl = canvas.toDataURL('image/jpeg', midQ);
            const testSize = getByteSize(testUrl);

            if (testSize <= targetBytes) {
              bestDataUrl = testUrl;
              minQ = midQ;
            } else {
              maxQ = midQ;
            }
          }
          compressedDataUrl = bestDataUrl;
        } else {
          // सामान्य स्लाइडर मोड
          const quality = qualityRange ? qualityRange.value / 100 : 0.6;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (afterImg) afterImg.src = compressedDataUrl;

        const sizeInBytes = getByteSize(compressedDataUrl);
        if (compressedSizeText) compressedSizeText.textContent = formatBytes(sizeInBytes);

        if (downloadBtn) {
          downloadBtn.href = compressedDataUrl;
          downloadBtn.download = `compressed_${currentFile.name.split('.')[0]}.jpg`;
        }

        if (resultSection) resultSection.style.display = 'flex';
        setSliderPosition(50);

        compressBtn.innerHTML = originalBtnText;
        compressBtn.disabled = false;
      };
    });
  }

  function getByteSize(dataUrl) {
    const head = 'data:image/jpeg;base64,';
    return Math.round((dataUrl.length - head.length) * 3 / 4);
  }

  // ----------------------------------------------------
  // ↔️ BEFORE VS AFTER SLIDER (TOUCH + MOUSE)
  // ----------------------------------------------------
  function setSliderPosition(percentage) {
    percentage = Math.max(0, Math.min(100, percentage));
    if (afterWrapper) afterWrapper.style.width = `${percentage}%`;
    if (sliderHandle) sliderHandle.style.left = `${percentage}%`;
    if (afterImg && comparisonSlider) afterImg.style.width = `${comparisonSlider.offsetWidth}px`;
  }

  function handleMove(e) {
    if (!isDragging || !comparisonSlider) return;
    const rect = comparisonSlider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    setSliderPosition((offsetX / rect.width) * 100);
  }

  if (comparisonSlider) {
    comparisonSlider.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleMove(e);
    });
    window.addEventListener('mouseup', () => (isDragging = false));
    window.addEventListener('mousemove', handleMove);

    comparisonSlider.addEventListener('touchstart', (e) => {
      isDragging = true;
      handleMove(e);
    }, { passive: true });
    window.addEventListener('touchend', () => (isDragging = false));
    window.addEventListener('touchmove', handleMove, { passive: true });
  }

  window.addEventListener('resize', () => {
    if (resultSection && resultSection.style.display !== 'none') {
      const currentWidthPercent = afterWrapper ? parseFloat(afterWrapper.style.width) || 50 : 50;
      setSliderPosition(currentWidthPercent);
    }
  });

  // ----------------------------------------------------
  // ☕ BUY ME A COFFEE
  // ----------------------------------------------------
  if (openModalBtn && coffeeModal) openModalBtn.addEventListener('click', () => (coffeeModal.style.display = 'flex'));
  if (closeModalBtn && coffeeModal) closeModalBtn.addEventListener('click', () => (coffeeModal.style.display = 'none'));
  window.addEventListener('click', (e) => {
    if (e.target === coffeeModal) coffeeModal.style.display = 'none';
  });

  if (copyUpiBtn && upiText) {
    copyUpiBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(upiText.textContent.trim()).then(() => {
        const originalIcon = copyUpiBtn.innerHTML;
        copyUpiBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => (copyUpiBtn.innerHTML = originalIcon), 2000);
      });
    });
  }

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
});
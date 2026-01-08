(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    function openPortraitCropModal(dataUrl) {
        app.elements.portraitCropImage.src = dataUrl;
        app.elements.portraitCropModal.classList.remove('hidden');
    }

    function getPortraitFrameSize() {
        const rect = app.elements.portraitCropFrame.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
    }

    function clampPortraitOffsets() {
        const frame = getPortraitFrameSize();
        const imgWidth = app.elements.portraitCropImage.naturalWidth * app.state.portraitCropState.scale;
        const imgHeight = app.elements.portraitCropImage.naturalHeight * app.state.portraitCropState.scale;
        const minX = frame.width - imgWidth;
        const minY = frame.height - imgHeight;
        app.state.portraitCropState.offsetX = Math.min(0, Math.max(minX, app.state.portraitCropState.offsetX));
        app.state.portraitCropState.offsetY = Math.min(0, Math.max(minY, app.state.portraitCropState.offsetY));
    }

    function applyPortraitTransform() {
        const { offsetX, offsetY, scale } = app.state.portraitCropState;
        app.elements.portraitCropImage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    function initializePortraitCrop() {
        const frame = getPortraitFrameSize();
        const scaleX = frame.width / app.elements.portraitCropImage.naturalWidth;
        const scaleY = frame.height / app.elements.portraitCropImage.naturalHeight;
        app.state.portraitCropState.minScale = Math.max(scaleX, scaleY);
        app.state.portraitCropState.scale = app.state.portraitCropState.minScale;
        app.state.portraitCropState.offsetX = (frame.width - app.elements.portraitCropImage.naturalWidth * app.state.portraitCropState.scale) / 2;
        app.state.portraitCropState.offsetY = (frame.height - app.elements.portraitCropImage.naturalHeight * app.state.portraitCropState.scale) / 2;

        app.elements.portraitZoomInput.min = app.state.portraitCropState.minScale.toFixed(2);
        app.elements.portraitZoomInput.max = (app.state.portraitCropState.minScale * 3).toFixed(2);
        app.elements.portraitZoomInput.value = app.state.portraitCropState.scale.toFixed(2);
        applyPortraitTransform();
    }

    function closePortraitCropModal() {
        app.state.portraitCropState.dragging = false;
        app.elements.portraitCropModal.classList.add('hidden');
        app.elements.portraitCropImage.removeAttribute('src');
        app.elements.portraitUploadInput.value = '';
    }

    function confirmPortraitCrop() {
        const frame = getPortraitFrameSize();
        const sourceX = Math.max(0, -app.state.portraitCropState.offsetX / app.state.portraitCropState.scale);
        const sourceY = Math.max(0, -app.state.portraitCropState.offsetY / app.state.portraitCropState.scale);
        const sourceW = frame.width / app.state.portraitCropState.scale;
        const sourceH = frame.height / app.state.portraitCropState.scale;
        const outputSize = 300;
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            app.elements.portraitCropImage,
            sourceX,
            sourceY,
            sourceW,
            sourceH,
            0,
            0,
            outputSize,
            outputSize
        );
        app.elements.portraitPreview.src = canvas.toDataURL('image/png');
        if (app.storage && app.storage.saveToLocalStorage) {
            app.storage.saveToLocalStorage();
        }
        closePortraitCropModal();
    }

    function init() {
        const {
            portraitCropFrame,
            portraitCropImage,
            portraitZoomInput,
            portraitCropConfirm,
            portraitCropCancel,
            portraitCropModal,
            portraitUploadInput
        } = app.elements;

        portraitUploadInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => openPortraitCropModal(e.target.result);
            reader.readAsDataURL(file);
        });

        portraitCropImage.addEventListener('load', initializePortraitCrop);
        portraitZoomInput.addEventListener('input', () => {
            app.state.portraitCropState.scale = parseFloat(portraitZoomInput.value) || app.state.portraitCropState.minScale;
            clampPortraitOffsets();
            applyPortraitTransform();
        });

        portraitCropFrame.addEventListener('pointerdown', (e) => {
            if (!portraitCropImage.src) return;
            app.state.portraitCropState.dragging = true;
            app.state.portraitCropState.dragStartX = e.clientX;
            app.state.portraitCropState.dragStartY = e.clientY;
            app.state.portraitCropState.startOffsetX = app.state.portraitCropState.offsetX;
            app.state.portraitCropState.startOffsetY = app.state.portraitCropState.offsetY;
            portraitCropFrame.setPointerCapture(e.pointerId);
        });

        portraitCropFrame.addEventListener('pointermove', (e) => {
            if (!app.state.portraitCropState.dragging) return;
            const deltaX = e.clientX - app.state.portraitCropState.dragStartX;
            const deltaY = e.clientY - app.state.portraitCropState.dragStartY;
            app.state.portraitCropState.offsetX = app.state.portraitCropState.startOffsetX + deltaX;
            app.state.portraitCropState.offsetY = app.state.portraitCropState.startOffsetY + deltaY;
            clampPortraitOffsets();
            applyPortraitTransform();
        });

        portraitCropFrame.addEventListener('pointerup', (e) => {
            app.state.portraitCropState.dragging = false;
            if (portraitCropFrame.hasPointerCapture(e.pointerId)) {
                portraitCropFrame.releasePointerCapture(e.pointerId);
            }
        });

        portraitCropFrame.addEventListener('pointercancel', () => {
            app.state.portraitCropState.dragging = false;
        });

        portraitCropConfirm.addEventListener('click', confirmPortraitCrop);
        portraitCropCancel.addEventListener('click', closePortraitCropModal);
        portraitCropModal.addEventListener('click', (e) => {
            if (e.target === portraitCropModal) closePortraitCropModal();
        });
    }

    app.portrait = {
        openPortraitCropModal,
        initializePortraitCrop,
        closePortraitCropModal,
        confirmPortraitCrop,
        init
    };
})();

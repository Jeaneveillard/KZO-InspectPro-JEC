// photo_editor.js - KZO InspectPro Photo Editor
// Permet d'éditer des photos avec Canvas (dessin, flèches, cercles, texte)

(function() {
    let canvas, ctx;
    let isDrawing = false;
    let startX = 0, startY = 0;
    let snapshot;
    let currentTool = 'arrow'; // 'freehand', 'arrow', 'circle', 'text'
    let currentColor = '#ef4444'; // default red
    let currentLineWidth = 5;
    
    // Pour la fonctionnalité Undo
    let history = [];
    
    let onSaveCallback = null;
    let originalImageObj = null;
    
    // Wrapper pour app.js
    window.openAnnotationEditor = function(photoObj, onSave) {
        if (!photoObj.originalUrl) {
            photoObj.originalUrl = photoObj.url; // Save original
        }
        
        window.openPhotoEditor(photoObj.url, function(newDataUrl) {
            photoObj.url = newDataUrl;
            if (onSave) onSave();
        });
    };

    window.initPhotoEditor = function() {
        canvas = document.getElementById('photoEditorCanvas');
        if(!canvas) return;
        ctx = canvas.getContext('2d');
        
        // Setup listeners
        canvas.addEventListener('mousedown', startPosition);
        canvas.addEventListener('mouseup', endPosition);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseout', endPosition);
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }, {passive: false});
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }, {passive: false});
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvas.dispatchEvent(mouseEvent);
        });
        
        // Tool buttons
        document.querySelectorAll('.editor-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.editor-tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTool = btn.dataset.tool;
                
                if (currentTool === 'text') {
                    canvas.style.cursor = 'text';
                } else {
                    canvas.style.cursor = 'crosshair';
                }
            });
        });
        
        // Color buttons
        document.querySelectorAll('.editor-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.editor-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentColor = btn.dataset.color;
            });
        });
        
        // Action buttons
        document.getElementById('editorUndoBtn')?.addEventListener('click', undo);
        document.getElementById('editorClearBtn')?.addEventListener('click', clearCanvas);
        document.getElementById('editorCancelBtn')?.addEventListener('click', closeEditor);
        document.getElementById('editorSaveBtn')?.addEventListener('click', saveCanvas);
    };

    window.openPhotoEditor = function(base64Image, saveCallback) {
        onSaveCallback = saveCallback;
        history = [];
        
        const modal = document.getElementById('photoEditorModal');
        if(!modal) return;
        modal.style.display = 'flex';
        
        originalImageObj = new Image();
        originalImageObj.onload = function() {
            // Resize canvas to fit screen while maintaining aspect ratio
            const maxWidth = window.innerWidth * 0.9;
            const maxHeight = window.innerHeight * 0.7;
            
            let width = originalImageObj.width;
            let height = originalImageObj.height;
            
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            
            if (ratio < 1) {
                width = width * ratio;
                height = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(originalImageObj, 0, 0, canvas.width, canvas.height);
            saveState(); // Save initial state
        };
        originalImageObj.src = base64Image;
    };

    function closeEditor() {
        document.getElementById('photoEditorModal').style.display = 'none';
        onSaveCallback = null;
    }

    function saveCanvas() {
        if(onSaveCallback) {
            // Quality 0.8 to compress slightly
            const newImage = canvas.toDataURL('image/jpeg', 0.8);
            onSaveCallback(newImage);
        }
        closeEditor();
    }

    function saveState() {
        history.push(canvas.toDataURL());
    }

    function undo() {
        if (history.length > 1) {
            history.pop(); // remove current state
            const previousState = history[history.length - 1];
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = previousState;
        } else if (history.length === 1) {
            // Only initial image left
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[0];
        }
    }

    function clearCanvas() {
        if (history.length > 0) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                saveState();
            };
            img.src = history[0]; // redraw original
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function _drawTextAt(pos, text) {
        if (!text) return;
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = currentColor;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, pos.x, pos.y);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        saveState();
    }

    function startPosition(e) {
        if(currentTool === 'text') {
            const pos = getMousePos(e);
            if (window._promptModal) {
                window._promptModal("Entrez le texte à insérer :").then(text => _drawTextAt(pos, text));
            } else {
                _drawTextAt(pos, prompt("Entrez le texte à insérer :"));
            }
            return;
        }

        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;
        
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;
        
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if(currentTool === 'freehand') {
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY);
            ctx.stroke();
        }
    }

    function endPosition() {
        if(!isDrawing) return;
        isDrawing = false;
        ctx.beginPath();
        if(currentTool !== 'text') {
            saveState();
        }
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);

        if (currentTool === 'freehand') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (currentTool === 'arrow') {
            ctx.putImageData(snapshot, 0, 0);
            drawArrow(startX, startY, pos.x, pos.y);
        } else if (currentTool === 'circle') {
            ctx.putImageData(snapshot, 0, 0);
            drawCircle(startX, startY, pos.x, pos.y);
        }
    }

    function drawCircle(x1, y1, x2, y2) {
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    function drawArrow(fromx, fromy, tox, toy) {
        const headlen = 20; // length of head in pixels
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(tox, toy);
        ctx.fillStyle = currentColor;
        ctx.fill();
    }

    // Initialize when DOM is ready
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initPhotoEditor);
    } else {
        window.initPhotoEditor();
    }

})();

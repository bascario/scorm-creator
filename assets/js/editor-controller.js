/**
 * ================================================
 * EDITOR SCORM - CONTROLADOR (MVC)
 * Gestiona la lógica e interacciones del editor
 * ================================================
 */

const EditorController = {
    /**
     * Inicializa el controlador
     */
    init() {
        console.log('Inicializando EditorController...');
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Actualizar vista
        EditorView.render();
        
        console.log('EditorController inicializado');
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Título del curso
        document.getElementById('course-title-input').addEventListener('change', (e) => {
            EditorModel.setCourseTitle(e.target.value);
            EditorView.showToast('Título actualizado', 'success');
        });
        
        // Cambio de contenido de diapositiva
        document.getElementById('slide-title').addEventListener('change', (e) => {
            const slide = EditorModel.getCurrentSlide();
            if (slide) {
                EditorModel.updateSlide(slide.id, { title: e.target.value });
                EditorView.renderCourseStructure();
                EditorView.renderPreview();
            }
        });
        
        document.getElementById('slide-subtitle').addEventListener('change', (e) => {
            const slide = EditorModel.getCurrentSlide();
            if (slide) {
                EditorModel.updateSlide(slide.id, { subtitle: e.target.value });
                EditorView.renderPreview();
            }
        });
        
        document.getElementById('slide-module').addEventListener('change', (e) => {
            const slide = EditorModel.getCurrentSlide();
            if (slide && e.target.value) {
                EditorModel.updateSlide(slide.id, { moduleId: parseInt(e.target.value) });
                EditorView.renderCourseStructure();
            }
        });
        
        // Editor de código
        document.getElementById('code-editor').addEventListener('input', (e) => {
            // Auto-guardado del código
        });
        
        // Opciones de imagen
        document.querySelectorAll('input[name="image-style"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const direction = document.getElementById('float-direction');
                const transparency = document.getElementById('transparency-slider');
                
                direction.style.display = e.target.value === 'floating' ? 'flex' : 'none';
                transparency.style.display = e.target.value === 'transparent' ? 'flex' : 'none';
            });
        });
        
        // Dropzone de imágenes
        const dropzone = document.getElementById('image-dropzone');
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                this.handleImageDrop(e);
            });
        }
        
        // Input de imagen
        document.getElementById('image-input').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
    },

    /**
     * Establece el modo de vista (Design/Developer)
     */
    setViewMode(mode) {
        EditorModel.setViewMode(mode);
        EditorView.switchView(mode);
    },

    /**
     * Alterna un módulo en el sidebar
     */
    toggleModule(moduleId) {
        const moduleEl = document.querySelector(`.module-item[data-module-id="${moduleId}"]`);
        if (moduleEl) {
            moduleEl.classList.toggle('expanded');
        }
    },

    /**
     * Selecciona una diapositiva
     */
    selectSlide(slideId) {
        EditorModel.setCurrentSlide(slideId);
        EditorView.highlightSelectedSlide(slideId);
        EditorView.renderSlideEditor();
        EditorView.renderPreview();
    },

    /**
     * Agrega un nuevo módulo
     */
    addModule() {
        const title = prompt('Título del módulo:', `Módulo ${EditorModel.data.modules.length + 1}`);
        if (title) {
            EditorModel.addModule(title);
            EditorView.renderCourseStructure();
            EditorView.showToast('Módulo creado', 'success');
        }
    },

    /**
     * Agrega una nueva diapositiva
     */
    addSlide() {
        const modules = EditorModel.data.modules;
        
        // Si solo hay un módulo, usarlo directamente
        let moduleId;
        
        if (modules.length === 0) {
            // No hay módulos, crear uno
            EditorModel.addModule('Módulo 1');
            moduleId = EditorModel.data.modules[0].id;
        } else if (modules.length === 1) {
            // Solo un módulo, usarlo
            moduleId = modules[0].id;
        } else {
            // Múltiples módulos - mostrar selector
            moduleId = this.showModuleSelector();
            if (!moduleId) return; // Cancelado
        }
        
        const slide = EditorModel.addSlide(moduleId);
        if (slide) {
            const module = EditorModel.data.modules.find(m => m.id === moduleId);
            
            EditorModel.setCurrentSlide(slide.id);
            EditorView.renderCourseStructure();
            EditorView.renderSlideEditor();
            EditorView.renderPreview();
            EditorView.updateSlideCount();
            EditorView.showToast('Diapositiva creada en ' + (module ? module.title : 'Módulo'), 'success');
        }
    },

    /**
     * Muestra un selector de módulo y retorna el ID seleccionado
     */
    showModuleSelector() {
        const modules = EditorModel.data.modules;
        
        // Crear un modal simple para seleccionar
        let html = '<div id="module-selector-modal" class="modal active">';
        html += '<div class="modal-content">';
        html += '<div class="modal-header"><h3>Seleccionar en que Módulo agregar la diapositiva</h3></div>';
        html += '<div class="modal-body">';
        
        modules.forEach((mod, idx) => {
            html += `<button class="module-select-btn" onclick="EditorController.selectModuleAndAddSlide(${mod.id})">`;
            html += `<span class="module-icon">${mod.icon || '📚'}</span>`;
            html += `<span class="module-name">${mod.title}</span>`;
            html += `<span class="slide-count">${mod.slides ? mod.slides.length : 0} diapositivas</span>`;
            html += '</button>';
        });
        
        html += '</div></div></div>';
        
        // Agregar al body temporalmente
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-module-selector';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        
        // Retornar null (el usuario debe hacer clic)
        return null;
    },

    /**
     * Selecciona un módulo y agrega la diapositiva
     */
    selectModuleAndAddSlide(moduleId) {
        // Remover el modal temporal
        const tempModal = document.getElementById('temp-module-selector');
        if (tempModal) tempModal.remove();
        
        const slide = EditorModel.addSlide(moduleId);
        if (slide) {
            const module = EditorModel.data.modules.find(m => m.id === moduleId);
            EditorModel.setCurrentSlide(slide.id);
            EditorView.renderCourseStructure();
            EditorView.renderSlideEditor();
            EditorView.renderPreview();
            EditorView.updateSlideCount();
            EditorView.showToast('Diapositiva creada en ' + (module ? module.title : 'Módulo'), 'success');
        }
    },

    /**
     * Elimina la diapositiva actual
     */
    deleteCurrentSlide() {
        const currentSlide = EditorModel.getCurrentSlide();
        if (!currentSlide) {
            EditorView.showToast('No hay diapositiva seleccionada', 'error');
            return;
        }
        
        if (confirm('¿Estás seguro de eliminar esta diapositiva?')) {
            EditorModel.removeSlide(currentSlide.id);
            EditorModel.setCurrentSlide(null);
            EditorView.renderCourseStructure();
            EditorView.renderSlideEditor();
            EditorView.renderPreview();
            EditorView.updateSlideCount();
            EditorView.showToast('Diapositiva eliminada', 'success');
        }
    },

    /**
     * Maneja el cambio de contenido
     */
    handleContentChange() {
        const content = document.querySelector('.editable-content');
        if (content) {
            const slide = EditorModel.getCurrentSlide();
            if (slide) {
                EditorModel.updateSlide(slide.id, { content: content.innerHTML });
                EditorView.renderPreview();
            }
        }
    },

    /**
     * Muestra el modal de configuración
     */
    showSettingsModal() {
        // Cargar valores actuales
        document.getElementById('institution-name').value = EditorModel.data.institutionName || '';
        
        const settings = EditorModel.getSettings();
        document.getElementById('primary-color').value = settings.primaryColor;
        document.getElementById('secondary-color').value = settings.secondaryColor;
        document.getElementById('accent-color').value = settings.accentColor;
        
        EditorView.showModal('settings-modal');
    },

    /**
     * Guarda la configuración
     */
    saveSettings() {
        const institutionName = document.getElementById('institution-name').value;
        const primaryColor = document.getElementById('primary-color').value;
        const secondaryColor = document.getElementById('secondary-color').value;
        const accentColor = document.getElementById('accent-color').value;
        
        EditorModel.setInstitutionName(institutionName);
        EditorModel.updateSettings({
            primaryColor,
            secondaryColor,
            accentColor
        });
        
        this.closeModal('settings-modal');
        EditorView.renderPreview();
        EditorView.showToast('Configuración guardada', 'success');
    },

    /**
     * Cierra un modal
     */
    closeModal(modalId) {
        EditorView.hideModal(modalId);
    },

    /**
     * Muestra el gestor de imágenes
     */
    showImageManager() {
        const slide = EditorModel.getCurrentSlide();
        if (!slide) {
            EditorView.showToast('Selecciona una diapositiva primero', 'error');
            return;
        }
        
        EditorView.renderImageGallery();
        EditorView.showModal('image-modal');
    },

    /**
     * Maneja la carga de imágenes
     */
    handleImageUpload(e) {
        const files = e.target.files;
        this.processImages(files);
    },

    /**
     * Maneja el drop de imágenes
     */
    handleImageDrop(e) {
        const files = e.dataTransfer.files;
        this.processImages(files);
    },

    /**
     * Procesa las imágenes cargadas
     */
    processImages(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                EditorView.showToast('Solo se permiten imágenes', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    name: file.name,
                    data: e.target.result,
                    type: file.type
                };
                EditorModel.addImage(imageData);
                EditorView.renderImageGallery();
                EditorView.showToast('Imagen cargada', 'success');
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Selecciona una imagen
     */
    selectImage(imageId) {
        document.querySelectorAll('.image-gallery-item').forEach(item => {
            item.classList.remove('selected');
            if (parseInt(item.dataset.id) === imageId) {
                item.classList.add('selected');
            }
        });
        
        this.selectedImageId = imageId;
    },

    /**
     * Inserta la imagen seleccionada
     */
    insertSelectedImage() {
        if (!this.selectedImageId) {
            EditorView.showToast('Selecciona una imagen', 'error');
            return;
        }
        
        const image = EditorModel.getImages().find(img => img.id === this.selectedImageId);
        if (!image) return;
        
        const style = document.querySelector('input[name="image-style"]:checked').value;
        const direction = document.querySelector('input[name="float-direction"]:checked')?.value || 'left';
        const transparency = document.getElementById('transparency-level').value;
        
        let imgClass = 'content-image';
        
        if (style === 'floating') {
            imgClass += direction === 'left' ? ' floating-left' : ' floating-right';
        } else if (style === 'boxed') {
            imgClass += ' boxed';
        } else if (style === 'transparent') {
            imgClass += ' transparent';
            image.data = this.applyTransparency(image.data, transparency);
        }
        
        const imgHtml = `<img src="${image.data}" class="${imgClass}" alt="${image.name}">`;
        this.insertIntoContent(imgHtml);
        
        this.closeModal('image-modal');
        this.selectedImageId = null;
        EditorView.showToast('Imagen insertada', 'success');
    },

    /**
     * Aplica transparencia a una imagen
     */
    applyTransparency(dataUrl, level) {
        // En una implementación real, usarías Canvas API
        return dataUrl;
    },

    /**
     * Inserta HTML en el contenido
     */
    insertIntoContent(html) {
        const slide = EditorModel.getCurrentSlide();
        if (!slide) return;
        
        const currentContent = slide.content || '';
        EditorModel.updateSlide(slide.id, { content: currentContent + html });
        
        EditorView.renderContent(slide);
        EditorView.renderPreview();
    },

    /**
     * Inserta una imagen directamente
     */
    insertImage() {
        this.showImageManager();
    },

    /**
     * Establece la flotación de imagen
     */
    setImageFloat(direction) {
        const selected = document.querySelector('.content-element.selected img');
        if (selected) {
            selected.classList.remove('floating-left', 'floating-right');
            if (direction !== 'none') {
                selected.classList.add(`floating-${direction}`);
            }
            this.handleContentChange();
        }
    },

    /**
     * Alterna el cuadro de la imagen
     */
    toggleImageBox() {
        const selected = document.querySelector('.content-element.selected img');
        if (selected) {
            selected.classList.toggle('boxed');
            this.handleContentChange();
        }
    },

    /**
     * Alterna la transparencia
     */
    toggleImageTransparency() {
        const selected = document.querySelector('.content-element.selected img');
        if (selected) {
            selected.classList.toggle('transparent');
            this.handleContentChange();
        }
    },

    /**
     * Elimina el elemento seleccionado
     */
    deleteSelectedElement() {
        const selected = document.querySelector('.content-element.selected');
        if (selected) {
            selected.remove();
            this.handleContentChange();
            document.getElementById('content-tools').style.display = 'none';
            EditorView.showToast('Elemento eliminado', 'success');
        }
    },

    /**
     * Agrega un cuadro de texto
     */
    addTextBox() {
        const html = `
            <div class="content-element">
                <p>Haz clic y escribe tu texto aquí...</p>
            </div>
        `;
        this.insertIntoContent(html);
    },

    /**
     * Agrega una tabla
     */
    addTable() {
        EditorView.showModal('table-modal');
    },

    /**
     * Inserta una tabla
     */
    insertTable() {
        const rows = parseInt(document.getElementById('table-rows').value);
        const cols = parseInt(document.getElementById('table-cols').value);
        const style = document.getElementById('table-style').value;
        
        let html = `<table class="data-table ${style}"><thead><tr>`;
        
        // Encabezados
        for (let i = 0; i < cols; i++) {
            html += `<th>Columna ${i + 1}</th>`;
        }
        
        html += `</tr></thead><tbody>`;
        
        // Filas de datos
        for (let i = 0; i < rows - 1; i++) {
            html += `<tr>`;
            for (let j = 0; j < cols; j++) {
                html += `<td>Dato ${i + 1}-${j + 1}</td>`;
            }
            html += `</tr>`;
        }
        
        html += `</tbody></table>`;
        
        this.insertIntoContent(html);
        this.closeModal('table-modal');
        EditorView.showToast('Tabla insertada', 'success');
    },

    /**
     * Muestra el modal de columnas
     */
    addColumns() {
        EditorView.showModal('columns-modal');
    },

    /**
     * Inserta columnas
     */
    insertColumns(numCols) {
        let html = `<div class="content-columns col-${numCols}">`;
        
        for (let i = 0; i < numCols; i++) {
            html += `
                <div class="content-column">
                    <p>Columna ${i + 1}</p>
                    <p>Contenido de la columna...</p>
                </div>
            `;
        }
        
        html += `</div><div style="clear:both"></div>`;
        
        this.insertIntoContent(html);
        this.closeModal('columns-modal');
        EditorView.showToast('Columnas insertadas', 'success');
    },

    /**
     * Agrega un cuadro de notas
     */
    addNoteBox(type) {
        const labels = {
            advantage: 'Ventaja',
            disadvantage: 'Desventaja',
            suggestion: 'Sugerencia',
            info: 'Información'
        };
        
        const icons = {
            advantage: 'fa-plus-circle',
            disadvantage: 'fa-minus-circle',
            suggestion: 'fa-lightbulb',
            info: 'fa-info-circle'
        };
        
        const html = `
            <div class="note-box ${type}">
                <div class="note-box-header">
                    <i class="fas ${icons[type]}"></i>
                    <span>${labels[type]}</span>
                </div>
                <p>Escribe aquí tu ${labels[type].toLowerCase()}...</p>
            </div>
        `;
        
        this.insertIntoContent(html);
    },

    /**
     * Muestra el modal de caso práctico
     */
    addPracticalCase() {
        EditorView.showModal('practical-case-modal');
    },

    /**
     * Guarda el caso práctico
     */
    savePracticalCase() {
        const title = document.getElementById('case-title').value;
        const problem = document.getElementById('case-problem').value;
        const solution = document.getElementById('case-solution').value;
        const resources = document.getElementById('case-resources').value;
        
        if (!title || !problem) {
            EditorView.showToast('Completa los campos obligatorios', 'error');
            return;
        }
        
        const resourcesList = resources ? resources.split(',').map(r => 
            `<span class="resource-tag">${r.trim()}</span>`
        ).join('') : '';
        
        const html = `
            <div class="practical-case">
                <div class="practical-case-header">
                    <div class="practical-case-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <h4>${title}</h4>
                </div>
                <div class="case-section">
                    <h5>📋 Problema</h5>
                    <p>${problem}</p>
                </div>
                <div class="case-section">
                    <h5>✅ Solución</h5>
                    <p>${solution}</p>
                </div>
                ${resources ? `
                <div class="case-section">
                    <h5>🔧 Recursos</h5>
                    <div class="case-resources">
                        ${resourcesList}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        this.insertIntoContent(html);
        this.closeModal('practical-case-modal');
        
        // Limpiar campos
        document.getElementById('case-title').value = '';
        document.getElementById('case-problem').value = '';
        document.getElementById('case-solution').value = '';
        document.getElementById('case-resources').value = '';
        
        EditorView.showToast('Caso práctico agregado', 'success');
    },

    /**
     * Agrega una evaluación
     */
    addEvaluation() {
        // Mostrar el modal de evaluación
        EditorView.showModal('evaluation-modal');
        EditorView.renderQuizQuestions();
    },

    /**
     * Agrega una pregunta al quiz desde el modal
     */
    addQuizQuestion() {
        const questionText = document.getElementById('quiz-question-text').value.trim();
        const option0 = document.getElementById('quiz-option-0').value.trim();
        const option1 = document.getElementById('quiz-option-1').value.trim();
        const option2 = document.getElementById('quiz-option-2').value.trim();
        const option3 = document.getElementById('quiz-option-3').value.trim();
        const correctOption = parseInt(document.querySelector('input[name="correct-option"]:checked').value);
        
        if (!questionText) {
            EditorView.showToast('Escribe una pregunta', 'error');
            return;
        }
        
        const options = [option0, option1, option2, option3];
        if (options.filter(o => o).length < 2) {
            EditorView.showToast('Agrega al menos 2 opciones', 'error');
            return;
        }
        
        // Asegurar que la opción correcta tenga contenido
        if (!options[correctOption]) {
            EditorView.showToast('La respuesta correcta debe tener texto', 'error');
            return;
        }
        
        EditorModel.addQuizQuestion({
            question: questionText,
            options: options,
            correct: correctOption
        });
        
        // Limpiar el formulario
        document.getElementById('quiz-question-text').value = '';
        document.getElementById('quiz-option-0').value = '';
        document.getElementById('quiz-option-1').value = '';
        document.getElementById('quiz-option-2').value = '';
        document.getElementById('quiz-option-3').value = '';
        document.querySelector('input[name="correct-option"][value="0"]').checked = true;
        
        EditorView.renderQuizQuestions();
        EditorView.showToast('Pregunta agregada', 'success');
    },

    /**
     * Elimina una pregunta del quiz
     */
    deleteQuizQuestion(questionId) {
        EditorModel.removeQuizQuestion(questionId);
        EditorView.renderQuizQuestions();
        EditorView.showToast('Pregunta eliminada', 'success');
    },

    /**
     * Inserta la evaluación en la diapositiva actual
     */
    insertEvaluationToSlide() {
        const questions = EditorModel.getQuizQuestions();
        
        if (questions.length === 0) {
            EditorView.showToast('Agrega al menos una pregunta', 'error');
            return;
        }
        
        const slide = EditorModel.getCurrentSlide();
        if (!slide) {
            EditorView.showToast('Selecciona una diapositiva primero', 'error');
            return;
        }
        
        // Crear HTML de la evaluación
        let html = `
            <div class="content-element evaluation-section">
                <h3>📝 Evaluación Final</h3>
                <p>Responde las siguientes preguntas para completar el curso:</p>
                <div class="evaluation-questions" data-quiz-id="${Date.now()}">
        `;
        
        questions.forEach((q, idx) => {
            const letters = ['A', 'B', 'C', 'D'];
            html += `
                <div class="quiz-question-item">
                    <p class="question-text"><strong>${idx + 1}.</strong> ${q.question}</p>
                    <div class="quiz-options">
            `;
            q.options.forEach((opt, optIdx) => {
                if (opt) {
                    html += `
                        <label class="quiz-option-label">
                            <input type="radio" name="q${idx}" value="${optIdx}">
                            <span class="option-letter">${letters[optIdx]}</span>
                            <span class="option-text">${opt}</span>
                        </label>
                    `;
                }
            });
            html += `</div></div>`;
        });
        
        html += `
                </div>
                <button class="btn-primary quiz-submit-btn" onclick="submitQuizFromEditor(this)">
                    Enviar Respuestas
                </button>
            </div>
        `;
        
        this.insertIntoContent(html);
        this.closeModal('evaluation-modal');
        EditorView.showToast('Evaluación insertada en la diapositiva', 'success');
    },

    /**
     * Formatea el código
     */
    formatCode() {
        try {
            const editor = document.getElementById('code-editor');
            const obj = JSON.parse(editor.value);
            editor.value = JSON.stringify(obj, null, 2);
            EditorView.showToast('Código formateado', 'success');
        } catch (e) {
            EditorView.showToast('Error al formatear: ' + e.message, 'error');
        }
    },

    /**
     * Valida el código
     */
    validateCode() {
        try {
            const editor = document.getElementById('code-editor');
            const obj = JSON.parse(editor.value);
            
            // Intentar importar al modelo
            EditorModel.data = { ...EditorModel.data, ...obj };
            EditorModel.saveToStorage();
            
            EditorView.render();
            EditorView.showToast('Código válido', 'success');
            
            document.getElementById('code-output').className = 'code-output success';
            document.getElementById('code-output').textContent = '✓ Validación exitosa';
        } catch (e) {
            document.getElementById('code-output').className = 'code-output error';
            document.getElementById('code-output').textContent = '✗ Error: ' + e.message;
            EditorView.showToast('Error de validación', 'error');
        }
    },

    /**
     * Alterna el tamaño de vista previa
     */
    togglePreviewSize() {
        const preview = document.querySelector('.preview-frame');
        preview.classList.toggle('fullscreen');
    },

    /**
     * Exporta el contenido como PDF
     */
    exportPDF() {
        // Verificar que hay institución configurada
        if (!EditorModel.data.institutionName) {
            EditorView.showToast('Configura el nombre de la institución primero', 'info');
            this.showSettingsModal();
            return;
        }
        
        // Crear documento PDF usando la API de impresión
        const printWindow = window.open('', '_blank');
        
        const slides = EditorModel.getAllSlides();
        const institutionName = EditorModel.data.institutionName;
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${EditorModel.data.courseTitle} - PDF</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .institution { font-size: 18px; font-weight: bold; color: #2c3e50; }
                    .course-title { font-size: 24px; margin: 10px 0; }
                    .slide { 
                        page-break-after: always; 
                        margin-bottom: 40px;
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .slide-title { font-size: 20px; color: #2c3e50; margin-bottom: 10px; }
                    .slide-subtitle { font-size: 16px; color: #666; margin-bottom: 15px; }
                    .slide-content { font-size: 14px; line-height: 1.6; }
                    .practical-case { 
                        background: #f8f9fa; 
                        border-left: 4px solid #3498db; 
                        padding: 15px;
                        margin: 15px 0;
                    }
                    .note-box { padding: 10px; margin: 10px 0; border-radius: 4px; }
                    .note-box.advantage { background: rgba(39, 174, 96, 0.1); border-left: 4px solid #27ae60; }
                    .note-box.disadvantage { background: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; }
                    .note-box.suggestion { background: rgba(243, 156, 18, 0.1); border-left: 4px solid #f39c12; }
                    .note-box.info { background: rgba(155, 89, 182, 0.1); border-left: 4px solid #9b59b6; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #2c3e50; color: white; }
                    @media print {
                        .slide { page-break-after: always; }
                    }
                    @page { margin: 1cm; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="institution">${institutionName}</div>
                    <div class="course-title">${EditorModel.data.courseTitle}</div>
                </div>
        `;
        
        slides.forEach((slide, index) => {
            html += `
                <div class="slide">
                    <div class="slide-number">Diapositiva ${index + 1}</div>
                    <h2 class="slide-title">${slide.title}</h2>
                    ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
                    <div class="slide-content">${slide.content}</div>
                </div>
            `;
        });
        
        html += `
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Esperar a que cargue y luego imprimir
        printWindow.onload = function() {
            printWindow.print();
        };
        
        EditorView.showToast('Generando PDF...', 'info');
    },

    /**
     * Exporta el paquete SCORM como ZIP
     */
    exportSCORMAsZip() {
        // Validar datos
        const validation = EditorModel.validate();
        
        if (!validation.valid) {
            validation.errors.forEach(error => {
                EditorView.showToast(error, 'error');
            });
            return;
        }
        
        EditorView.showToast('Generando paquete SCORM...', 'info');
        
        // Obtener datos del curso
        const scormData = EditorModel.getSCORMPackage();
        const courseTitle = scormData.title || 'Curso_SCORM';
        const safeTitle = courseTitle.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Crear los archivos del paquete SCORM
        const files = {};
        
        // 1. imsmanifest.xml
        files['imsmanifest.xml'] = this.generateIMSManifest(scormData);
        
        // 2. index.html
        files['index.html'] = this.generateIndexHTML(scormData);
        
        // 3. styles.css
        files['styles.css'] = this.generateStylesCSS(scormData);
        
        // 4. scorm-api.js
        files['scorm-api.js'] = this.generateScormAPI();
        
        // 5. content.js
        files['content.js'] = this.generateContentJS(scormData);
        
        // 6. main.js
        files['main.js'] = this.generateMainJS(scormData);
        
        // Crear el ZIP usando JSZip (si está disponible) o generar descarga directa
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            
            // Agregar archivos al ZIP
            Object.keys(files).forEach(filename => {
                zip.file(filename, files[filename]);
            });
            
            // Agregar carpeta assets si hay imágenes
            const images = EditorModel.getImages();
            if (images.length > 0) {
                const assetsFolder = zip.folder('assets/images');
                images.forEach(img => {
                    const base64Data = img.data.split(',')[1];
                    assetsFolder.file(img.name, base64Data, {base64: true});
                });
            }
            
            // Generar y descargar el ZIP
            zip.generateAsync({type: 'blob'}).then(function(content) {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${safeTitle}_SCORM.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                EditorView.showToast('Paquete SCORM descargado', 'success');
            });
        } else {
            // Fallback: descargar como JSON con todos los datos
            const packageData = {
                scormData: scormData,
                html: files['index.html'],
                manifest: files['imsmanifest.xml'],
                styles: files['styles.css'],
                scripts: {
                    'scorm-api.js': files['scorm-api.js'],
                    'content.js': files['content.js'],
                    'main.js': files['main.js']
                }
            };
            
            const blob = new Blob([JSON.stringify(packageData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}_SCORM_Package.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            EditorView.showToast('Nota: JSZip no disponible. Descargando como JSON. Incluye el archivo imsmanifest.xml y otros archivos en tu LMS.', 'info');
        }
    },

    /**
     * Genera el archivo imsmanifest.xml
     */
    generateIMSManifest(scormData) {
        const title = scormData.title || 'Curso SCORM';
        const modules = scormData.modules || [];
        
        let organizations = '';
        let resources = '';
        
        modules.forEach((mod, modIdx) => {
            const modId = mod.id || modIdx + 1;
            organizations += `
            <item identifier="MODULE_${modId}" identifierref="RES_${modId}">
                <title>${mod.title}</title>
            </item>`;
            
            resources += `
            <resource identifier="RES_${modId}" type="webcontent" adlcp:scormtype="sco" href="index.html">
                <file href="index.html"/>
                <file href="styles.css"/>
                <file href="scorm-api.js"/>
                <file href="content.js"/>
                <file href="main.js"/>
            </resource>`;
        });
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${title.replace(/\s+/g, '_')}" version="1.0"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                        http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
    
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
    </metadata>
    
    <organizations default="ORG_${title.replace(/\s+/g, '_')}">
        <organization identifier="ORG_${title.replace(/\s+/g, '_')}">
            <title>${title}</title>
            ${organizations}
        </organization>
    </organizations>
    
    <resources>
        ${resources}
    </resources>
</manifest>`;
    },

    /**
     * Genera el archivo index.html del paquete
     */
    generateIndexHTML(scormData) {
        const title = scormData.title || 'Curso SCORM';
        const institution = scormData.institution || {};
        const settings = scormData.settings || {};
        const primary = settings.primaryColor || '#3498db';
        const secondary = settings.secondaryColor || '#2c3e50';
        const accent = settings.accentColor || '#27ae60';
        const totalModules = (scormData.modules || []).length;
        
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div id="scorm-api-container"></div>
    
    <!-- Header de Navegación -->
    <header class="main-header">
        <div class="header-brand">
            <svg class="pc-icon-small" viewBox="0 0 200 200" width="40" height="40">
                <rect x="30" y="40" width="140" height="100" rx="10" fill="${secondary}"/>
                <rect x="40" y="50" width="120" height="80" rx="5" fill="${primary}"/>
                <rect x="90" y="140" width="20" height="30" fill="${secondary}"/>
                <rect x="60" y="170" width="80" height="10" rx="3" fill="#34495e"/>
                <circle cx="100" cy="90" r="20" fill="#ecf0f1" class="screen-glow"/>
                <rect x="45" y="55" width="40" height="5" rx="2" fill="${accent}" class="led"/>
            </svg>
            <span>${title}</span>
        </div>
        <nav class="header-nav">
            <span class="nav-link active">
                <i class="fas fa-play-circle"></i> Ver Curso
            </span>
        </nav>
    </header>
    
    <!-- Pantalla de Inicio -->
    <div id="welcome-screen" class="screen active">
        <div class="welcome-content">
            <div class="logo-container">
                <svg class="pc-icon" viewBox="0 0 200 200">
                    <rect x="30" y="40" width="140" height="100" rx="10" fill="${secondary}"/>
                    <rect x="40" y="50" width="120" height="80" rx="5" fill="${primary}"/>
                    <rect x="90" y="140" width="20" height="30" fill="${secondary}"/>
                    <rect x="60" y="170" width="80" height="10" rx="3" fill="#34495e"/>
                    <circle cx="100" cy="90" r="20" fill="#ecf0f1" class="screen-glow"/>
                    <rect x="45" y="55" width="40" height="5" rx="2" fill="${accent}" class="led"/>
                </svg>
            </div>
            <h1 class="title">${title}</h1>
            <h2 class="subtitle">${institution.name || 'Curso Interactivo'}</h2>
            <p class="description">Curso interactivo SCORM</p>
            
            <div class="features">
                <div class="feature">
                    <span class="feature-icon">🎯</span>
                    <span>Aprendizaje Activo</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🔧</span>
                    <span>Práctica Real</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">📊</span>
                    <span>Seguimiento</span>
                </div>
            </div>
            
            <button id="start-btn" class="btn-primary">
                <span>Comenzar Curso</span>
                <svg class="arrow-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
            </button>
            
            <div class="progress-info">
                <span id="total-slides-display">0 Diapositivas Interactivas</span>
                <span class="separator">•</span>
                <span>${totalModules} Módulos</span>
                <span class="separator">•</span>
                <span>Evaluación Final</span>
            </div>
        </div>
    </div>
    
    <!-- Contenedor Principal de Diapositivas -->
    <div id="slides-container" class="screen">
        <!-- Barra de Navegación Superior -->
        <nav class="top-nav">
            <div class="nav-left">
                <button id="menu-btn" class="nav-btn" title="Menú">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                </button>
                <span class="course-title">${title}</span>
            </div>
            <div class="nav-center">
                <span id="module-indicator">Módulo 1</span>
            </div>
            <div class="nav-right">
                <button id="progress-btn" class="nav-btn" title="Progreso">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                    </svg>
                    <span id="progress-percent">0%</span>
                </button>
            </div>
        </nav>
        
        <!-- Área de Diapositiva -->
        <main class="slides-viewport">
            <div id="slide-wrapper"></div>
        </main>
        
        <!-- Controles de Navegación -->
        <footer class="slide-controls">
            <button id="prev-btn" class="control-btn" disabled>
                <svg viewBox="0 0 24 24" width="28" height="28">
                    <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
                <span>Anterior</span>
            </button>
            
            <div class="slide-info">
                <span id="slide-number">1</span>
                <span class="separator">/</span>
                <span id="total-slides">0</span>
            </div>
            
            <button id="next-btn" class="control-btn">
                <span>Siguiente</span>
                <svg viewBox="0 0 24 24" width="28" height="28">
                    <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
            </button>
        </footer>
        
        <!-- Barra de Progreso -->
        <div class="progress-bar-container">
            <div id="progress-bar" class="progress-bar"></div>
        </div>
    </div>
    
    <!-- Menú Lateral -->
    <div id="side-menu" class="side-menu">
        <div class="menu-header">
            <h3>Contenido del Curso</h3>
            <button id="close-menu" class="close-btn">&times;</button>
        </div>
        <div class="menu-content"></div>
    </div>
    
    <!-- Modal de Evaluación -->
    <div id="quiz-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="quiz-title">Evaluación</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="quiz-question"></div>
                <div id="quiz-options"></div>
            </div>
            <div class="modal-footer">
                <span id="quiz-feedback"></span>
                <button id="quiz-next" class="btn-primary" disabled>Siguiente</button>
            </div>
        </div>
    </div>
    
    <!-- Modal de Resultado Final -->
    <div id="result-modal" class="modal">
        <div class="modal-content result-content">
            <div class="result-icon">
                <svg viewBox="0 0 100 100" width="120" height="120">
                    <circle cx="50" cy="50" r="45" fill="${accent}"/>
                    <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" fill="none" class="check-animation"/>
                </svg>
            </div>
            <h2>¡Felicitaciones!</h2>
            <p>Has completado el curso</p>
            <div class="result-score">
                <span id="final-score">0%</span>
                <span>de respuestas correctas</span>
            </div>
            <button id="restart-btn" class="btn-primary">Reiniciar Curso</button>
        </div>
    </div>
    
    <script src="scorm-api.js"></script>
    <script src="content.js"></script>
    <script src="main.js"></script>
</body>
</html>`;
    },

    /**
     * Genera el CSS del paquete
     */
    generateStylesCSS(scormData) {
        const settings = scormData.settings || {};
        const primary = settings.primaryColor || '#3498db';
        const secondary = settings.secondaryColor || '#2c3e50';
        const accent = settings.accentColor || '#27ae60';
        
        return `/* Estilos del Curso SCORM */
:root {
    --primary: ${primary};
    --secondary: ${secondary};
    --accent: ${accent};
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f6fa; color: #333; line-height: 1.6; }

.screen { display: none; }
.screen.active { display: block; }

.btn-primary {
    background: ${primary};
    color: white;
    padding: 15px 40px;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}
.btn-primary:hover {
    background: ${secondary};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

/* Header */
.main-header {
    background: linear-gradient(135deg, ${secondary} 0%, #34495e 100%);
    color: white;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.header-brand {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 20px;
    font-weight: bold;
}
.pc-icon-small {
    width: 40px;
    height: 40px;
}
.screen-glow {
    animation: glow 2s ease-in-out infinite alternate;
}
.led {
    animation: blink 1s ease-in-out infinite;
}
@keyframes glow {
    from { opacity: 0.5; }
    to { opacity: 1; }
}
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
.header-nav {
    display: flex;
    gap: 20px;
}
.nav-link {
    color: white;
    text-decoration: none;
    padding: 8px 15px;
    border-radius: 20px;
    transition: background 0.3s;
}
.nav-link.active {
    background: rgba(255,255,255,0.2);
}

/* Welcome Screen */
.welcome-screen {
    min-height: calc(100vh - 70px);
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(180deg, #f5f6fa 0%, #e8ecf1 100%);
}
.welcome-content {
    text-align: center;
    max-width: 700px;
    padding: 60px 40px;
}
.logo-container {
    margin-bottom: 30px;
}
.pc-icon {
    width: 180px;
    height: 180px;
}
.welcome-content h1 {
    font-size: 3em;
    color: ${secondary};
    margin-bottom: 5px;
}
.welcome-content h2 {
    font-size: 1.8em;
    color: ${primary};
    font-weight: 400;
    margin-bottom: 20px;
}
.welcome-content .description {
    font-size: 1.3em;
    color: #666;
    margin-bottom: 40px;
}
.features {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 50px;
}
.feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.feature-icon {
    font-size: 36px;
}
.progress-info {
    margin-top: 40px;
    color: #666;
    font-size: 14px;
}
.progress-info .separator {
    margin: 0 10px;
    color: ${primary};
}
.arrow-icon {
    transition: transform 0.3s;
}
.btn-primary:hover .arrow-icon {
    transform: translateX(5px);
}

/* Slides Container */
.slides-container {
    padding: 20px;
}
.top-nav {
    background: white;
    padding: 12px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    position: sticky;
    top: 0;
    z-index: 100;
}
.nav-left, .nav-right {
    display: flex;
    align-items: center;
    gap: 15px;
}
.nav-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.3s;
}
.nav-btn:hover {
    background: #f0f0f0;
}
.course-title {
    font-weight: 600;
    color: ${secondary};
}
#module-indicator {
    background: ${primary};
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 14px;
}
.slides-viewport {
    max-width: 1200px;
    margin: 30px auto;
    padding: 0 20px;
}
#slide-wrapper {
    background: white;
    border-radius: 15px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    min-height: 500px;
}
#slide-wrapper h2 {
    color: ${primary};
    font-size: 2em;
    margin-bottom: 10px;
}
#slide-wrapper .subtitle {
    color: #666;
    font-size: 1.2em;
    margin-bottom: 30px;
}
.slide-content {
    font-size: 1.1em;
    line-height: 1.8;
}

/* Controls */
.slide-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding: 25px;
    background: white;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}
.control-btn {
    background: ${primary};
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s;
}
.control-btn:hover:not(:disabled) {
    background: ${secondary};
    transform: translateY(-2px);
}
.control-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}
.slide-info {
    font-size: 18px;
    font-weight: 600;
    color: ${secondary};
}
.progress-bar-container {
    height: 4px;
    background: #e0e0e0;
}
.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, ${primary}, ${accent});
    transition: width 0.3s;
}

/* Side Menu */
.side-menu {
    position: fixed;
    left: -350px;
    top: 0;
    width: 350px;
    height: 100vh;
    background: white;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    transition: left 0.3s;
    z-index: 1000;
    overflow-y: auto;
}
.side-menu.open {
    left: 0;
}
.menu-header {
    background: ${secondary};
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
}
.menu-content {
    padding: 15px;
}
.menu-module {
    margin-bottom: 20px;
}
.menu-module h4 {
    color: ${primary};
    padding: 10px;
    background: #f5f6fa;
    border-radius: 8px;
    margin-bottom: 10px;
}
.menu-module ul {
    list-style: none;
}
.menu-module li {
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 5px;
    transition: background 0.3s;
}
.menu-module li:hover {
    background: #f0f0f0;
}
.menu-module li.active {
    background: ${primary};
    color: white;
}

/* Modals */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 2000;
    justify-content: center;
    align-items: center;
}
.modal.active {
    display: flex;
}
.modal-content {
    background: white;
    border-radius: 15px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}
.modal-header h3 {
    color: ${secondary};
}
.close-modal {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
}
.quiz-option {
    padding: 15px;
    margin: 10px 0;
    border: 2px solid #eee;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}
.quiz-option:hover {
    border-color: ${primary};
    background: #f8f9fa;
}
.quiz-option.correct {
    background: #d4edda;
    border-color: #28a745;
}
.quiz-option.incorrect {
    background: #f8d7da;
    border-color: #dc3545;
}

.result-content {
    text-align: center;
}
.result-icon {
    margin-bottom: 20px;
}
.result-score {
    font-size: 2.5em;
    color: ${accent};
    margin: 20px 0;
}
#quiz-feedback {
    font-weight: bold;
    margin-right: 15px;
}
#quiz-feedback.correct { color: #28a745; }
#quiz-feedback.incorrect { color: #dc3545; }

/* Responsive */
@media (max-width: 768px) {
    .features {
        flex-direction: column;
        gap: 20px;
    }
    .welcome-content h1 {
        font-size: 2em;
    }
    #slide-wrapper {
        padding: 20px;
    }
}
`;
    },

    /**
     * Genera el archivo scorm-api.js
     */
    generateScormAPI() {
        return `/**
 * SCORM 1.2 API Wrapper
 */
const SCORM = {
    API: null,
    initialized: false,
    
    init() {
        this.API = window.API;
        if (!this.API) {
            this.API = this.findAPI(window);
        }
        if (this.API) {
            this.initialized = this.API.LMSInitialize('') === 'true';
            this.log('SCORM inicializado');
        }
    },
    
    findAPI(win) {
        let attempts = 0;
        while (win && attempts < 10) {
            if (win.API) return win.API;
            if (win.parent === win) break;
            win = win.parent;
            attempts++;
        }
        return null;
    },
    
    log(msg) { console.log('[SCORM] ' + msg); },
    
    setComplete() {
        if (this.API && this.initialized) {
            this.API.LMSSetValue('cmi.core.lesson_status', 'completed');
            this.API.LMSCommit('');
            this.log('Curso marcado como completado');
        }
    },
    
    setScore(score) {
        if (this.API && this.initialized) {
            this.API.LMSSetValue('cmi.core.score.raw', score);
            this.API.LMSCommit('');
        }
    },
    
    terminate() {
        if (this.API && this.initialized) {
            this.API.LMSFinish('');
            this.log('Sesión SCORM finalizada');
        }
    }
};

window.SCORM = SCORM;`;
    },

    /**
     * Genera el archivo content.js
     */
    generateContentJS(scormData) {
        const title = scormData.title || 'Curso';
        const modules = scormData.modules || [];
        const quizQuestions = scormData.quizQuestions || [];
        
        // Convertir módulos a formato de slides
        const slides = [];
        modules.forEach(mod => {
            if (mod.slides) {
                mod.slides.forEach(slide => {
                    slides.push({
                        id: slide.id,
                        module: mod.id,
                        title: slide.title,
                        subtitle: slide.subtitle || '',
                        content: slide.content || ''
                    });
                });
            }
        });
        
        return `const courseContent = {
    title: "${title}",
    description: "Curso interactivo SCORM",
    modules: ${JSON.stringify(modules, null, 2)},
    slides: ${JSON.stringify(slides, null, 2)},
    quizQuestions: ${JSON.stringify(quizQuestions, null, 2)}
};`;
    },

    /**
     * Genera el archivo main.js
     */
    generateMainJS(scormData) {
        return `/**
 * Main JavaScript - SCORM Player
 */
const App = {
    currentSlide: 0,
    totalSlides: 0,
    progress: 0,
    quizScore: 0,
    quizAnswers: [],
    currentQuizQuestion: 0,
    completedSlides: new Set(),
    
    init() {
        this.totalSlides = courseContent.slides.length;
        document.getElementById('total-slides').textContent = this.totalSlides;
        if (document.getElementById('total-slides-display')) {
            document.getElementById('total-slides-display').textContent = this.totalSlides + ' Diapositivas Interactivas';
        }
        
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('prev-btn').addEventListener('click', () => this.prev());
        document.getElementById('next-btn').addEventListener('click', () => this.next());
        document.getElementById('menu-btn').addEventListener('click', () => this.toggleMenu());
        document.getElementById('close-menu').addEventListener('click', () => this.closeMenu());
        document.getElementById('restart-btn')?.addEventListener('click', () => this.restart());
        
        // Quiz modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeQuiz());
        });
        document.getElementById('quiz-next').addEventListener('click', () => this.nextQuizQuestion());
        
        this.renderMenu();
        SCORM.init();
    },
    
    start() {
        document.getElementById('welcome-screen').classList.remove('active');
        document.getElementById('slides-container').classList.add('active');
        this.renderSlide();
    },
    
    renderSlide() {
        const slide = courseContent.slides[this.currentSlide];
        const module = courseContent.modules.find(m => m.id === slide.module);
        
        document.getElementById('module-indicator').textContent = module ? module.title : '';
        document.getElementById('slide-number').textContent = this.currentSlide + 1;
        
        const wrapper = document.getElementById('slide-wrapper');
        wrapper.innerHTML = '<h2>' + slide.title + '</h2>';
        if (slide.subtitle) {
            wrapper.innerHTML += '<p class="subtitle">' + slide.subtitle + '</p>';
        }
        wrapper.innerHTML += '<div class="slide-content">' + slide.content + '</div>';
        
        document.getElementById('prev-btn').disabled = this.currentSlide === 0;
        document.getElementById('next-btn').disabled = this.currentSlide === this.totalSlides - 1;
        
        // Update progress bar
        const progressPercent = ((this.currentSlide + 1) / this.totalSlides) * 100;
        document.getElementById('progress-bar').style.width = progressPercent + '%';
        document.getElementById('progress-percent').textContent = Math.round(progressPercent) + '%';
    },
    
    next() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.completedSlides.add(this.currentSlide);
            this.currentSlide++;
            this.renderSlide();
        } else {
            // Last slide - show quiz or finish
            this.finishCourse();
        }
    },
    
    prev() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.renderSlide();
        }
    },
    
    finishCourse() {
        // Check if there are quiz questions
        if (courseContent.quizQuestions && courseContent.quizQuestions.length > 0) {
            this.startQuiz();
        } else {
            this.showResults();
        }
    },
    
    startQuiz() {
        this.currentQuizQuestion = 0;
        this.quizScore = 0;
        this.quizAnswers = [];
        document.getElementById('quiz-modal').classList.add('active');
        this.showQuizQuestion();
    },
    
    showQuizQuestion() {
        const question = courseContent.quizQuestions[this.currentQuizQuestion];
        const totalQuestions = courseContent.quizQuestions.length;
        const isLastQuestion = this.currentQuizQuestion === totalQuestions - 1;
        
        document.getElementById('quiz-title').textContent = 'Pregunta ' + (this.currentQuizQuestion + 1) + ' de ' + totalQuestions;
        document.getElementById('quiz-question').textContent = question.question;
        
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        
        question.options.forEach((option, index) => {
            if (option) {
                const optionEl = document.createElement('div');
                optionEl.className = 'quiz-option';
                optionEl.innerHTML = '<strong>' + letters[index] + '</strong> ' + option;
                optionEl.onclick = () => this.selectOption(index);
                optionsContainer.appendChild(optionEl);
            }
        });
        
        // Update button text based on whether it's the last question
        const nextBtn = document.getElementById('quiz-next');
        nextBtn.textContent = isLastQuestion ? 'Enviar Respuestas' : 'Siguiente';
        nextBtn.disabled = true;
        document.getElementById('quiz-feedback').textContent = '';
        document.getElementById('quiz-feedback').className = '';
    },
    
    selectOption(selectedIndex) {
        const question = courseContent.quizQuestions[this.currentQuizQuestion];
        const options = document.querySelectorAll('.quiz-option');
        
        options.forEach((opt, index) => {
            opt.style.pointerEvents = 'none';
            if (index === question.correct) {
                opt.classList.add('correct');
            } else if (index === selectedIndex && selectedIndex !== question.correct) {
                opt.classList.add('incorrect');
            }
        });
        
        if (selectedIndex === question.correct) {
            this.quizScore++;
            document.getElementById('quiz-feedback').textContent = '¡Correcto!';
            document.getElementById('quiz-feedback').className = 'correct';
        } else {
            document.getElementById('quiz-feedback').textContent = 'Incorrecto';
            document.getElementById('quiz-feedback').className = 'incorrect';
        }
        
        this.quizAnswers.push({
            question: this.currentQuizQuestion,
            selected: selectedIndex,
            correct: selectedIndex === question.correct
        });
        
        document.getElementById('quiz-next').disabled = false;
    },
    
    nextQuizQuestion() {
        const isLastQuestion = this.currentQuizQuestion >= courseContent.quizQuestions.length - 1;
        
        if (isLastQuestion) {
            // Submit the quiz
            this.closeQuiz();
            this.showResults();
        } else {
            this.currentQuizQuestion++;
            this.showQuizQuestion();
        }
    },
    
    closeQuiz() {
        document.getElementById('quiz-modal').classList.remove('active');
    },
    
    showResults() {
        const scorePercent = Math.round((this.quizScore / courseContent.quizQuestions.length) * 100);
        document.getElementById('final-score').textContent = scorePercent + '%';
        document.getElementById('result-modal').classList.add('active');
        SCORM.setComplete();
        SCORM.setScore(scorePercent);
    },
    
    restart() {
        document.getElementById('result-modal').classList.remove('active');
        this.currentSlide = 0;
        this.completedSlides.clear();
        this.quizScore = 0;
        this.quizAnswers = [];
        this.progress = 0;
        document.getElementById('welcome-screen').classList.add('active');
        document.getElementById('slides-container').classList.remove('active');
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-percent').textContent = '0%';
    },
    
    renderMenu() {
        const menuContent = document.querySelector('.menu-content');
        let html = '';
        courseContent.modules.forEach((m, idx) => {
            html += '<div class="menu-module">';
            html += '<h4>' + (m.icon || '📚') + ' ' + m.title + '</h4><ul>';
            let slideIndex = 0;
            courseContent.modules.slice(0, idx).forEach(prevMod => {
                slideIndex += prevMod.slides ? prevMod.slides.length : 0;
            });
            if (m.slides) {
                m.slides.forEach((s, i) => {
                    const slideTitle = courseContent.slides[slideIndex + i] ? courseContent.slides[slideIndex + i].title : 'Slide';
                    html += '<li onclick="App.goToSlide(' + (slideIndex + i) + ')" class="' + ((slideIndex + i) === this.currentSlide ? 'active' : '') + '">' + (i + 1) + '. ' + slideTitle + '</li>';
                });
            }
            html += '</ul></div>';
        });
        menuContent.innerHTML = html;
    },
    
    toggleMenu() { document.getElementById('side-menu').classList.add('open'); },
    closeMenu() { document.getElementById('side-menu').classList.remove('open'); },
    
    goToSlide(index) {
        this.currentSlide = index;
        this.renderSlide();
        this.closeMenu();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());`;
    }
};

// Exportar para uso global
window.EditorController = EditorController;

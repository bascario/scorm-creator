/**
 * ================================================
 * EDITOR SCORM - VISTA (MVC)
 * Gestiona la renderización de la interfaz
 * ================================================
 */

const EditorView = {
    /**
     * Inicializa la vista
     */
    init() {
        console.log('Inicializando EditorView...');
        this.render();
    },

    /**
     * Renderiza la interfaz completa
     */
    render() {
        this.renderCourseStructure();
        this.renderSlideEditor();
        this.renderPreview();
        this.updateSlideCount();
        this.updateViewModeButtons();
    },

    /**
     * Renderiza la estructura del curso en el sidebar
     */
    renderCourseStructure() {
        const container = document.getElementById('course-structure');
        const modules = EditorModel.data.modules;
        
        if (modules.length === 0) {
            container.innerHTML = `
                <div class="empty-structure">
                    <i class="fas fa-folder-open"></i>
                    <p>No hay módulos</p>
                    <p>Crea tu primer módulo</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        modules.forEach((module, moduleIdx) => {
            const slides = module.slides || [];
            
            html += `
                <div class="module-item ${moduleIdx === 0 ? 'expanded' : ''}" data-module-id="${module.id}">
                    <div class="module-header-item" onclick="EditorController.toggleModule(${module.id})">
                        <span class="module-icon">${module.icon || '📚'}</span>
                        <span class="module-title">${module.title}</span>
                        <span class="module-toggle">
                            <i class="fas fa-chevron-down"></i>
                        </span>
                    </div>
                    <div class="module-slides">
            `;
            
            slides.forEach((slide, slideIdx) => {
                html += `
                    <div class="slide-item" data-slide-id="${slide.id}" onclick="EditorController.selectSlide(${slide.id})">
                        <span class="slide-number">${slideIdx + 1}</span>
                        <span class="slide-title">${slide.title}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Actualizar el select de módulos
        this.renderModuleSelect();
    },

    /**
     * Renderiza el select de módulos
     */
    renderModuleSelect() {
        const select = document.getElementById('slide-module');
        const modules = EditorModel.data.modules;
        
        let html = '<option value="">Seleccionar módulo...</option>';
        
        modules.forEach(module => {
            html += `<option value="${module.id}">${module.title}</option>`;
        });
        
        select.innerHTML = html;
    },

    /**
     * Renderiza el editor de diapositivas
     */
    renderSlideEditor() {
        const currentSlide = EditorModel.getCurrentSlide();
        
        if (!currentSlide) {
            document.getElementById('content-editor').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Selecciona una diapositiva para editar su contenido</p>
                    <p>o crea una nueva diapositiva</p>
                </div>
            `;
            return;
        }
        
        // Actualizar campos del header
        document.getElementById('slide-title').value = currentSlide.title || '';
        document.getElementById('slide-subtitle').value = currentSlide.subtitle || '';
        document.getElementById('slide-module').value = currentSlide.moduleId || '';
        
        // Renderizar contenido
        this.renderContent(currentSlide);
    },

    /**
     * Renderiza el contenido de una diapositiva
     */
    renderContent(slide) {
        const container = document.getElementById('content-editor');
        
        if (!slide.content || slide.content === '') {
            container.innerHTML = `
                <div class="editable-content" contenteditable="true" oninput="EditorController.handleContentChange()">
                    <p>Haz clic aquí para agregar contenido...</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="editable-content" contenteditable="true" oninput="EditorController.handleContentChange()">
                ${slide.content}
            </div>
        `;
        
        // Agregar event listeners a los elementos
        this.setupContentElements();
    },

    /**
     * Configura los elementos de contenido
     */
    setupContentElements() {
        const container = document.getElementById('content-editor');
        const elements = container.querySelectorAll('.content-element');
        
        elements.forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Deseleccionar anterior
                container.querySelectorAll('.content-element.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Seleccionar actual
                this.classList.add('selected');
                EditorModel.setSelectedElement(this.dataset.id);
                
                // Mostrar herramientas contextuales
                document.getElementById('content-tools').style.display = 'flex';
            });
        });
        
        // Click en el área principal para deseleccionar
        container.addEventListener('click', function(e) {
            if (e.target === container || e.target.classList.contains('editable-content')) {
                container.querySelectorAll('.content-element.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                document.getElementById('content-tools').style.display = 'none';
                EditorModel.setSelectedElement(null);
            }
        });
    },

    /**
     * Renderiza la vista previa
     */
    renderPreview() {
        const currentSlide = EditorModel.getCurrentSlide();
        const container = document.querySelector('.preview-content');
        
        if (!currentSlide) {
            container.innerHTML = `
                <div class="preview-empty">
                    <p>Selecciona una diapositiva</p>
                </div>
            `;
            return;
        }
        
        const institutionName = EditorModel.data.institutionName;
        
        container.innerHTML = `
            <div class="preview-slide">
                ${institutionName ? `<div class="preview-institution">${institutionName}</div>` : ''}
                <h3>${currentSlide.title || 'Sin título'}</h3>
                <p class="preview-subtitle">${currentSlide.subtitle || ''}</p>
                <div class="preview-body">
                    ${currentSlide.content || '<p>Sin contenido</p>'}
                </div>
            </div>
        `;
    },

    /**
     * Actualiza el contador de diapositivas
     */
    updateSlideCount() {
        const count = EditorModel.getTotalSlides();
        document.getElementById('total-slides-count').textContent = count;
    },

    /**
     * Actualiza los botones de modo de vista
     */
    updateViewModeButtons() {
        const mode = EditorModel.getViewMode();
        
        document.getElementById('btn-design').classList.toggle('active', mode === 'design');
        document.getElementById('btn-developer').classList.toggle('active', mode === 'developer');
        
        // Mostrar/ocultar toolbar según el modo
        const toolbar = document.getElementById('toolbar');
        toolbar.style.display = mode === 'design' ? 'flex' : 'none';
    },

    /**
     * Cambia entre vistas
     */
    switchView(mode) {
        // Actualizar paneles
        document.getElementById('design-view').classList.toggle('active', mode === 'design');
        document.getElementById('developer-view').classList.toggle('active', mode === 'developer');
        
        // Si es modo desarrollador, actualizar el código
        if (mode === 'developer') {
            // Mostrar selector de tipo de código
            this.renderCodeEditor();
        }
        
        this.updateViewModeButtons();
    },

    /**
     * Renderiza el editor de código
     */
    renderCodeEditor() {
        const codeEditor = document.getElementById('code-editor');
        const json = EditorModel.getJSON();
        codeEditor.value = json;
    },

    /**
     * Renderiza el editor de código SCORM (XML)
     */
    renderSCORMCodeEditor() {
        const codeEditor = document.getElementById('code-editor');
        const scormData = EditorModel.getSCORMPackage();
        
        // Generar el imsmanifest.xml
        const title = scormData.title || 'Curso_SCORM';
        const modules = scormData.modules || [];
        
        let organizations = '';
        let resources = '';
        
        modules.forEach((mod, modIdx) => {
            const modId = mod.id || modIdx + 1;
            organizations += `
            <item identifier="MODULE_${modId}" identifierref="RES_${modId}">
                <title>${this.escapeXml(mod.title)}</title>
            </item>`;
            
            resources += `
            <resource identifier="RES_${modId}" type="webcontent" adlcp:scormtype="sco" href="index.html">
                <file href="index.html"/>
            </resource>`;
        });
        
        const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${title.replace(/\s+/g, '_')}" version="1.0"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
    
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
    </metadata>
    
    <organizations default="ORG_${title.replace(/\s+/g, '_')}">
        <organization identifier="ORG_${title.replace(/\s+/g, '_')}">
            <title>${this.escapeXml(title)}</title>${organizations}
        </organization>
    </organizations>
    
    <resources>${resources}
    </resources>
</manifest>`;
        
        codeEditor.value = manifestXml;
    },

    /**
     * Escapa caracteres XML
     */
    escapeXml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    /**
     * Muestra un toast
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Muestra un modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Oculta un modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Renderiza la galería de imágenes
     */
    renderImageGallery() {
        const gallery = document.getElementById('image-gallery');
        const images = EditorModel.getImages();
        
        if (images.length === 0) {
            gallery.innerHTML = '<p class="no-images">No hay imágenes cargadas</p>';
            return;
        }
        
        gallery.innerHTML = images.map(img => `
            <div class="image-gallery-item" data-id="${img.id}" onclick="EditorController.selectImage(${img.id})">
                <img src="${img.data}" alt="${img.name}">
            </div>
        `).join('');
    },

    /**
     * Actualiza el contenido HTML
     */
    updateContent(html) {
        const container = document.getElementById('content-editor');
        container.innerHTML = `
            <div class="editable-content" contenteditable="true" oninput="EditorController.handleContentChange()">
                ${html}
            </div>
        `;
        this.setupContentElements();
    },

    /**
     * Resalta la diapositiva seleccionada
     */
    highlightSelectedSlide(slideId) {
        document.querySelectorAll('.slide-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.slideId) === slideId) {
                item.classList.add('active');
            }
        });
    },

    /**
     * Renderiza las preguntas del quiz en el modal de evaluación
     */
    renderQuizQuestions() {
        const container = document.getElementById('quiz-questions-container');
        const countSpan = document.getElementById('quiz-questions-count');
        const questions = EditorModel.getQuizQuestions();
        
        countSpan.textContent = questions.length;
        
        if (questions.length === 0) {
            container.innerHTML = '<p class="no-questions">No hay preguntas creadas</p>';
            return;
        }
        
        const letters = ['A', 'B', 'C', 'D'];
        container.innerHTML = questions.map((q, idx) => `
            <div class="quiz-question-card" data-id="${q.id}">
                <div class="question-header">
                    <span class="question-number">${idx + 1}</span>
                    <button class="delete-question-btn" onclick="EditorController.deleteQuizQuestion(${q.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="question-text">${q.question}</p>
                <div class="question-options">
                    ${q.options.map((opt, optIdx) => opt ? `
                        <span class="option-tag ${optIdx === q.correct ? 'correct' : ''}">
                            ${letters[optIdx]}: ${opt}
                            ${optIdx === q.correct ? '<i class="fas fa-check"></i>' : ''}
                        </span>
                    ` : '').join('')}
                </div>
            </div>
        `).join('');
    }
};

// Exportar para uso global
window.EditorView = EditorView;

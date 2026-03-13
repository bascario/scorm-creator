/**
 * ================================================
 * EDITOR SCORM - MODELO (MVC)
 * Gestiona el estado y los datos del editor
 * ================================================
 */

const EditorModel = {
    // Estado del modelo
    data: {
        courseTitle: '',
        institutionName: '',
        institutionLogo: '',
        modules: [],
        currentSlide: null,
        currentModule: null,
        viewMode: 'design',
        settings: {
            primaryColor: '#3498db',
            secondaryColor: '#2c3e50',
            accentColor: '#27ae60'
        },
        images: [],
        selectedElement: null,
        quizQuestions: []
    },

    /**
     * Inicializa el modelo
     */
    init() {
        console.log('Inicializando EditorModel...');
        this.loadFromStorage();
        
        // Cargar contenido existente si está disponible
        if (typeof courseContent !== 'undefined') {
            this.importFromCourseContent(courseContent);
        }
        
        console.log('EditorModel inicializado:', this.data);
    },

    /**
     * Carga el estado desde localStorage
     */
    loadFromStorage() {
        const saved = localStorage.getItem('scormEditorData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...this.data, ...parsed };
                console.log('Datos cargados desde localStorage');
            } catch (e) {
                console.error('Error al cargar datos:', e);
            }
        }
    },

    /**
     * Guarda el estado en localStorage
     */
    saveToStorage() {
        localStorage.setItem('scormEditorData', JSON.stringify(this.data));
    },

    /**
     * Obtiene el curso completo en formato SCORM
     */
    getSCORMPackage() {
        return {
            title: this.data.courseTitle,
            institution: {
                name: this.data.institutionName,
                logo: this.data.institutionLogo
            },
            modules: this.data.modules,
            settings: this.data.settings,
            quizQuestions: this.data.quizQuestions,
            generatedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    },

    /**
     * Obtiene el JSON del curso
     */
    getJSON() {
        return JSON.stringify(this.getSCORMPackage(), null, 2);
    },

    /**
     * Importa desde el contenido del curso existente
     */
    importFromCourseContent(content) {
        this.data.courseTitle = content.title || '';
        
        // Convertir módulos
        if (content.modules) {
            this.data.modules = content.modules.map((mod, idx) => ({
                id: mod.id,
                title: mod.title,
                icon: mod.icon,
                slides: mod.slides || []
            }));
        }
        
        // Convertir slides
        if (content.slides) {
            const slides = content.slides.map(slide => ({
                id: slide.id,
                moduleId: slide.module,
                title: slide.title,
                subtitle: slide.subtitle || '',
                content: slide.content,
                andragogy: slide.andragogy || ''
            }));
            
            // Agregar slides a los módulos correspondientes
            this.data.modules.forEach(mod => {
                mod.slides = mod.slides.map(slideId => {
                    return slides.find(s => s.id === slideId);
                }).filter(s => s);
            });
        }
        
        console.log('Contenido importado:', this.data.modules.length, 'módulos');
    },

    /**
     * Actualiza el título del curso
     */
    setCourseTitle(title) {
        this.data.courseTitle = title;
        this.saveToStorage();
    },

    /**
     * Actualiza el nombre de la institución
     */
    setInstitutionName(name) {
        this.data.institutionName = name;
        this.saveToStorage();
    },

    /**
     * Actualiza el logo de la institución
     */
    setInstitutionLogo(logoData) {
        this.data.institutionLogo = logoData;
        this.saveToStorage();
    },

    /**
     * Agrega un nuevo módulo
     */
    addModule(title = 'Nuevo Módulo') {
        const newModule = {
            id: Date.now(),
            title: title,
            icon: '📚',
            slides: []
        };
        this.data.modules.push(newModule);
        this.saveToStorage();
        return newModule;
    },

    /**
     * Elimina un módulo
     */
    removeModule(moduleId) {
        this.data.modules = this.data.modules.filter(m => m.id !== moduleId);
        this.saveToStorage();
    },

    /**
     * Actualiza un módulo
     */
    updateModule(moduleId, updates) {
        const module = this.data.modules.find(m => m.id === moduleId);
        if (module) {
            Object.assign(module, updates);
            this.saveToStorage();
        }
    },

    /**
     * Agrega una nueva diapositiva
     */
    addSlide(moduleId = null) {
        // Si no se especifica módulo, usar el primero o crear uno
        if (!moduleId) {
            if (this.data.modules.length === 0) {
                this.addModule('Módulo 1');
            }
            moduleId = this.data.modules[0].id;
        }
        
        const module = this.data.modules.find(m => m.id === moduleId);
        if (!module) return null;
        
        const newSlide = {
            id: Date.now(),
            moduleId: moduleId,
            title: 'Nueva Diapositiva',
            subtitle: '',
            content: '',
            andragogy: ''
        };
        
        module.slides.push(newSlide);
        this.saveToStorage();
        return newSlide;
    },

    /**
     * Elimina una diapositiva
     */
    removeSlide(slideId) {
        this.data.modules.forEach(module => {
            module.slides = module.slides.filter(s => s.id !== slideId);
        });
        this.saveToStorage();
    },

    /**
     * Actualiza una diapositiva
     */
    updateSlide(slideId, updates) {
        this.data.modules.forEach(module => {
            const slide = module.slides.find(s => s.id === slideId);
            if (slide) {
                Object.assign(slide, updates);
            }
        });
        this.saveToStorage();
    },

    /**
     * Obtiene una diapositiva por ID
     */
    getSlide(slideId) {
        for (const module of this.data.modules) {
            const slide = module.slides.find(s => s.id === slideId);
            if (slide) return slide;
        }
        return null;
    },

    /**
     * Obtiene todas las diapositivas
     */
    getAllSlides() {
        const allSlides = [];
        this.data.modules.forEach((module, moduleIdx) => {
            module.slides.forEach((slide, slideIdx) => {
                allSlides.push({
                    ...slide,
                    moduleIndex: moduleIdx,
                    slideIndex: slideIdx,
                    moduleTitle: module.title
                });
            });
        });
        return allSlides;
    },

    /**
     * Establece la diapositiva actual
     */
    setCurrentSlide(slideId) {
        this.data.currentSlide = slideId;
        this.saveToStorage();
    },

    /**
     * Obtiene la diapositiva actual
     */
    getCurrentSlide() {
        if (this.data.currentSlide) {
            return this.getSlide(this.data.currentSlide);
        }
        return null;
    },

    /**
     * Establece el modo de vista
     */
    setViewMode(mode) {
        this.data.viewMode = mode;
        this.saveToStorage();
    },

    /**
     * Obtiene el modo de vista actual
     */
    getViewMode() {
        return this.data.viewMode;
    },

    /**
     * Agrega una imagen
     */
    addImage(imageData) {
        const image = {
            id: Date.now(),
            name: imageData.name,
            data: imageData.data,
            type: imageData.type
        };
        this.data.images.push(image);
        this.saveToStorage();
        return image;
    },

    /**
     * Obtiene todas las imágenes
     */
    getImages() {
        return this.data.images;
    },

    /**
     * Actualiza la configuración
     */
    updateSettings(settings) {
        this.data.settings = { ...this.data.settings, ...settings };
        this.saveToStorage();
    },

    /**
     * Obtiene la configuración
     */
    getSettings() {
        return this.data.settings;
    },

    /**
     * Obtiene el total de diapositivas
     */
    getTotalSlides() {
        return this.getAllSlides().length;
    },

    /**
     * Agrega un elemento de contenido a la diapositiva actual
     */
    addContentElement(slideId, element) {
        const slide = this.getSlide(slideId);
        if (slide) {
            if (!slide.contentElements) {
                slide.contentElements = [];
            }
            slide.contentElements.push({
                id: Date.now(),
                ...element
            });
            this.saveToStorage();
        }
    },

    /**
     * Establece el elemento seleccionado
     */
    setSelectedElement(elementId) {
        this.data.selectedElement = elementId;
    },

    /**
     * Obtiene el elemento seleccionado
     */
    getSelectedElement() {
        return this.data.selectedElement;
    },

    /**
     * Valida los datos del curso
     */
    validate() {
        const errors = [];
        
        if (!this.data.courseTitle) {
            errors.push('El curso necesita un título');
        }
        
        if (this.data.modules.length === 0) {
            errors.push('El curso necesita al menos un módulo');
        }
        
        let hasSlides = false;
        this.data.modules.forEach(mod => {
            if (mod.slides.length > 0) hasSlides = true;
        });
        
        if (!hasSlides) {
            errors.push('El curso necesita al menos una diapositiva');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Reinicia el editor
     */
    reset() {
        this.data = {
            courseTitle: '',
            institutionName: '',
            institutionLogo: '',
            modules: [],
            currentSlide: null,
            currentModule: null,
            viewMode: 'design',
            settings: {
                primaryColor: '#3498db',
                secondaryColor: '#2c3e50',
                accentColor: '#27ae60'
            },
            images: [],
            selectedElement: null,
            quizQuestions: []
        };
        this.saveToStorage();
    },

    /**
     * Agrega una pregunta de evaluación
     */
    addQuizQuestion(question) {
        const newQuestion = {
            id: Date.now(),
            question: question.question || '',
            options: question.options || ['', '', '', ''],
            correct: question.correct !== undefined ? question.correct : 0
        };
        this.data.quizQuestions.push(newQuestion);
        this.saveToStorage();
        return newQuestion;
    },

    /**
     * Elimina una pregunta de evaluación
     */
    removeQuizQuestion(questionId) {
        this.data.quizQuestions = this.data.quizQuestions.filter(q => q.id !== questionId);
        this.saveToStorage();
    },

    /**
     * Actualiza una pregunta de evaluación
     */
    updateQuizQuestion(questionId, updates) {
        const question = this.data.quizQuestions.find(q => q.id === questionId);
        if (question) {
            Object.assign(question, updates);
            this.saveToStorage();
        }
    },

    /**
     * Obtiene todas las preguntas de evaluación
     */
    getQuizQuestions() {
        return this.data.quizQuestions;
    }
};

// Exportar para uso global
window.EditorModel = EditorModel;

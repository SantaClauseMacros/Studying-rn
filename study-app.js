// Core Study Application Logic
class StudyApp {
    constructor() {
        this.flashcards = [];
        this.quizQuestions = [];
        this.currentCard = 0;
        this.stats = {
            cardsStudied: 0,
            correctAnswers: 0,
            hardCards: new Set()
        };
    }

    // Process the input notes
    processNotes(notes) {
        if (!notes.trim()) {
            showToast('Please enter some notes first!', 'error');
            return;
        }

        // Split into sentences while preserving important punctuation
        const sentences = notes
            .replace(/([.!?])\s+/g, '$1|')
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 10);

        this.generateFlashcards(sentences);
        this.generateQuiz(sentences);
        this.updateUI();
    }

    // Smart flashcard generation
    generateFlashcards(sentences) {
        this.flashcards = [];
        
        sentences.forEach(sentence => {
            // Generate definition cards
            if (this.isDefinition(sentence)) {
                this.createDefinitionCard(sentence);
            }

            // Generate concept cards
            this.createConceptCards(sentence);

            // Generate fact cards
            if (this.containsFactualContent(sentence)) {
                this.createFactCard(sentence);
            }
        });

        // Shuffle the flashcards
        this.shuffleArray(this.flashcards);
    }

    isDefinition(sentence) {
        const definitionPatterns = [
            /(.+?)\s+is\s+(.+)/i,
            /(.+?)\s+are\s+(.+)/i,
            /(.+?)\s+refers\s+to\s+(.+)/i,
            /(.+?)\s+means\s+(.+)/i,
            /(.+?)\s+defined\s+as\s+(.+)/i
        ];
        return definitionPatterns.some(pattern => pattern.test(sentence));
    }

    createDefinitionCard(sentence) {
        const matches = sentence.match(/(.+?)\s+(?:is|are|refers to|means|defined as)\s+(.+)/i);
        if (matches) {
            const [, term, definition] = matches;
            this.flashcards.push({
                type: 'definition',
                front: `What is ${term.trim()}?`,
                back: definition.trim(),
                difficulty: 'medium'
            });
        }
    }

    createConceptCards(sentence) {
        // Find important terms (longer words, capitalized words)
        const words = sentence.split(/\s+/);
        words.forEach((word, index) => {
            if (this.isImportantTerm(word)) {
                const question = words.map((w, i) => 
                    i === index ? '______' : w
                ).join(' ');
                
                this.flashcards.push({
                    type: 'concept',
                    front: question,
                    back: word,
                    difficulty: 'medium'
                });
            }
        });
    }

    isImportantTerm(word) {
        const cleanWord = word.replace(/[.,!?]/g, '');
        return (
            cleanWord.length > 5 &&
            !this.isCommonWord(cleanWord) &&
            (/^[A-Z]/.test(cleanWord) || /[A-Z]/.test(cleanWord) || cleanWord.length > 8)
        );
    }

    isCommonWord(word) {
        const commonWords = new Set([
            'about', 'above', 'after', 'again', 'against', 'although', 'always',
            'because', 'before', 'behind', 'below', 'beside', 'between', 'beyond',
            'during', 'either', 'enough', 'every', 'through', 'under', 'until',
            'within', 'without', 'would', 'could', 'should', 'their', 'there'
        ]);
        return commonWords.has(word.toLowerCase());
    }

    createFactCard(sentence) {
        // Look for sentences containing dates, numbers, or specific facts
        if (/\d+|in \d{4}|\d{4}s|first|second|third|last/i.test(sentence)) {
            this.flashcards.push({
                type: 'fact',
                front: this.createFactQuestion(sentence),
                back: sentence,
                difficulty: 'hard'
            });
        }
    }

    createFactQuestion(sentence) {
        // Replace specific details with blanks to create the question
        return sentence
            .replace(/\d+/g, '_____')
            .replace(/\b(in|during|after|before)\s+\d{4}/g, 'when')
            .replace(/\b(first|second|third|last)\b/g, 'which');
    }

    // Quiz generation
    generateQuiz(sentences) {
        this.quizQuestions = [];
        
        sentences.forEach(sentence => {
            // Multiple choice questions
            if (this.isDefinition(sentence)) {
                this.createMultipleChoiceQuestion(sentence);
            }

            // True/False questions
            if (this.containsFactualContent(sentence)) {
                this.createTrueFalseQuestion(sentence);
            }

            // Fill in the blank questions
            this.createFillInBlankQuestion(sentence);
        });

        // Shuffle questions
        this.shuffleArray(this.quizQuestions);
    }

    createMultipleChoiceQuestion(sentence) {
        const matches = sentence.match(/(.+?)\s+(?:is|are|refers to|means)\s+(.+)/i);
        if (matches) {
            const [, term, definition] = matches;
            const options = this.generateOptions(definition.trim());
            
            this.quizQuestions.push({
                type: 'multiple-choice',
                question: `What is ${term.trim()}?`,
                options: options,
                correct: definition.trim(),
                difficulty: 'medium'
            });
        }
    }

    generateOptions(correctAnswer) {
        // Generate plausible wrong answers
        const wrongAnswers = this.flashcards
            .filter(card => card.type === 'definition' && card.back !== correctAnswer)
            .map(card => card.back)
            .slice(0, 3);

        // Combine with correct answer and shuffle
        return this.shuffleArray([...wrongAnswers, correctAnswer]);
    }

    createTrueFalseQuestion(sentence) {
        this.quizQuestions.push({
            type: 'true-false',
            question: sentence,
            correct: true,
            difficulty: 'easy'
        });

        // Create false version by modifying the original
        this.quizQuestions.push({
            type: 'true-false',
            question: this.createFalseStatement(sentence),
            correct: false,
            difficulty: 'easy'
        });
    }

    createFalseStatement(sentence) {
        // Modify sentence to create false statement
        return sentence
            .replace(/is/g, 'is not')
            .replace(/are/g, 'are not')
            .replace(/can/g, 'cannot')
            .replace(/will/g, 'will not');
    }

    createFillInBlankQuestion(sentence) {
        const words = sentence.split(/\s+/);
        const keywordIndex = words.findIndex(word => this.isImportantTerm(word));
        
        if (keywordIndex !== -1) {
            const answer = words[keywordIndex];
            words[keywordIndex] = '_____';
            
            this.quizQuestions.push({
                type: 'fill-blank',
                question: words.join(' '),
                correct: answer,
                difficulty: 'hard'
            });
        }
    }

    // UI Updates
    updateUI() {
        this.updateFlashcard();
        this.updateQuiz();
        this.updateStats();
    }

    updateFlashcard() {
        if (this.flashcards.length === 0) return;

        const card = this.flashcards[this.currentCard];
        document.getElementById('cardFront').textContent = card.front;
        document.getElementById('cardBack').textContent = card.back;
        document.getElementById('cardProgress').textContent = 
            `Card ${this.currentCard + 1} of ${this.flashcards.length}`;
    }

    updateQuiz() {
        const quizContainer = document.getElementById('quizContainer');
        if (!quizContainer) return;

        quizContainer.innerHTML = this.quizQuestions.map((q, i) => `
            <div class="quiz-question p-4 bg-white rounded-lg shadow mb-4">
                <p class="font-bold mb-2">Question ${i + 1}:</p>
                <p class="mb-4">${q.question}</p>
                ${this.renderQuestionOptions(q, i)}
            </div>
        `).join('');
    }

    renderQuestionOptions(question, index) {
        switch (question.type) {
            case 'multiple-choice':
                return question.options.map(option => `
                    <label class="block mb-2">
                        <input type="radio" name="q${index}" value="${option}">
                        <span class="ml-2">${option}</span>
                    </label>
                `).join('');
            
            case 'true-false':
                return `
                    <label class="block mb-2">
                        <input type="radio" name="q${index}" value="true">
                        <span class="ml-2">True</span>
                    </label>
                    <label class="block mb-2">
                        <input type="radio" name="q${index}" value="false">
                        <span class="ml-2">False</span>
                    </label>
                `;
            
            case 'fill-blank':
                return `
                    <input type="text" name="q${index}" 
                        class="w-full p-2 border rounded" 
                        placeholder="Type your answer...">
                `;
        }
    }

    updateStats() {
        const statsContainer = document.getElementById('studyStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold">${this.stats.cardsStudied}</div>
                    <div class="text-sm text-gray-600">Cards Studied</div>
                </div>
                <div>
                    <div class="text-2xl font-bold">${this.stats.correctAnswers}</div>
                    <div class="text-sm text-gray-600">Correct Answers</div>
                </div>
                <div>
                    <div class="text-2xl font-bold">${this.stats.hardCards.size}</div>
                    <div class="text-sm text-gray-600">To Review</div>
                </div>
            </div>
        `;
    }

    // Utility Functions
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    containsFactualContent(sentence) {
        return /\d+|in \d{4}|\d{4}s|first|second|third|last/i.test(sentence) ||
               /is|are|was|were/.test(sentence);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg
            ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize the application
const studyApp = new StudyApp();

// Event Handlers
function processNotes() {
    const notes = document.getElementById('notesInput').value;
    studyApp.processNotes(notes);
}

function nextCard() {
    if (studyApp.currentCard < studyApp.flashcards.length - 1) {
        studyApp.currentCard++;
        studyApp.updateFlashcard();
    }
}

function previousCard() {
    if (studyApp.currentCard > 0) {
        studyApp.currentCard--;
        studyApp.updateFlashcard();
    }
}

function flipCard() {
    document.querySelector('.card-container').classList.toggle('flipped');
}

function checkAnswers() {
    let score = 0;
    studyApp.quizQuestions.forEach((q, i) => {
        const answer = document.querySelector(`[name="q${i}"]`).value;
        if (answer === String(q.correct)) score++;
    });

    const percentage = Math.round((score / studyApp.quizQuestions.length) * 100);
    studyApp.stats.correctAnswers = score;
    studyApp.updateStats();
    studyApp.showToast(`Score: ${percentage}%`);
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedNotes = localStorage.getItem('studyNotes');
    if (savedNotes) {
        document.getElementById('notesInput').value = savedNotes;
        studyApp.processNotes(savedNotes);
    }
});

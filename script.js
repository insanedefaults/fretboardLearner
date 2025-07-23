class FretboardLearner {
    constructor() {
        this.currentNoteIndex = 0;
        
        // Define open string notes and chromatic scale (starting from C)
        this.openStrings = ['E', 'B', 'G', 'D', 'A', 'E'];  // High to low E
        this.chromaticScale = ['C', 'd', 'D', 'e', 'E', 'F', 'g', 'G', 'a', 'A', 'b', 'B'];
        
        // Spaced repetition tracking
        this.recentPerformance = [];  // Rolling window of recent attempts
        this.maxHistorySize = 50;     // Keep last 50 attempts
        
        this.notes = this.generateRandomNotes();
        this.init();
    }
    
    getNoteForStringAndFret(string, fret) {
        // Get the open string note
        const openNote = this.openStrings[string];
        
        // Find the open note's position in the chromatic scale
        const openNoteIndex = this.chromaticScale.indexOf(openNote);
        
        // Calculate the new note position (add fret number)
        const newNoteIndex = (openNoteIndex + fret) % 12;
        
        // Return the note at that position
        return this.chromaticScale[newNoteIndex];
    }
    
    // Debug method to verify calculations
    testCalculation() {
        console.log('Low E string (index 5), 4th fret:');
        console.log('Open E position:', this.chromaticScale.indexOf('E'));
        console.log('4th fret result:', this.getNoteForStringAndFret(5, 4));
        console.log('Expected: a (A♭)');
    }
    
    trackPerformance(string, fret, note, wasCorrect) {
        // Create a unique key for this string/fret combination
        const noteKey = `${string}-${fret}`;
        
        // Add to recent performance history
        this.recentPerformance.push({
            noteKey: noteKey,
            string: string,
            fret: fret,
            note: note,
            wasCorrect: wasCorrect,
            timestamp: Date.now()
        });
        
        // Keep only recent attempts (rolling window)
        if (this.recentPerformance.length > this.maxHistorySize) {
            this.recentPerformance.shift();
        }
    }
    
    getNoteDifficulty(string, fret) {
        const noteKey = `${string}-${fret}`;
        
        // Find recent attempts for this specific string/fret combination
        const recentAttempts = this.recentPerformance.filter(attempt => 
            attempt.noteKey === noteKey
        );
        
        if (recentAttempts.length === 0) {
            return 1; // Default weight for new notes
        }
        
        // Calculate recent success rate (more recent attempts weighted higher)
        let totalWeight = 0;
        let successWeight = 0;
        
        recentAttempts.forEach((attempt, index) => {
            // More recent attempts get higher weight (exponential decay)
            const recencyWeight = Math.pow(0.8, recentAttempts.length - index - 1);
            totalWeight += recencyWeight;
            
            if (attempt.wasCorrect) {
                successWeight += recencyWeight;
            }
        });
        
        const successRate = successWeight / totalWeight;
        
        // Convert success rate to difficulty weight (lower success = higher weight)
        // Success rate 0.0 -> weight 5.0, Success rate 1.0 -> weight 0.2
        return Math.max(0.2, 5.0 * (1 - successRate));
    }
    
    generateRandomNotes() {
        const notes = [];
        
        for (let i = 0; i < 8; i++) {
            const measure = Math.floor(i / 4);  // 0 for first 4 notes, 1 for last 4
            const beat = i % 4;                 // 0-3 for beat position within measure
            
            // Use weighted selection based on recent performance
            const { string, fret } = this.selectWeightedStringAndFret();
            
            // Calculate the note name for this string/fret combination
            const note = this.getNoteForStringAndFret(string, fret);
            
            notes.push({
                measure: measure,
                beat: beat,
                string: string,
                fret: fret,
                note: note
            });
        }
        
        return notes;
    }
    
    selectWeightedStringAndFret() {
        // Create weighted list of all possible string/fret combinations
        const weightedOptions = [];
        
        for (let string = 0; string < 6; string++) {
            for (let fret = 0; fret < 6; fret++) {
                const difficulty = this.getNoteDifficulty(string, fret);
                
                // Add multiple copies based on difficulty weight
                const copies = Math.ceil(difficulty);
                for (let c = 0; c < copies; c++) {
                    weightedOptions.push({ string, fret });
                }
            }
        }
        
        // Randomly select from weighted options
        const randomIndex = Math.floor(Math.random() * weightedOptions.length);
        return weightedOptions[randomIndex];
    }
    
    init() {
        this.populateTabFromNotes();
        this.setupEventListeners();
        this.highlightCurrentNote();
    }
    
    populateTabFromNotes() {
        // Clear all note spaces first
        document.querySelectorAll('.note-space').forEach(space => {
            space.textContent = '';
            space.title = ''; // Clear any existing tooltips
        });
        
        // Populate each note in the tablature
        this.notes.forEach((noteData, index) => {
            const noteSpace = document.querySelector(
                `[data-measure="${noteData.measure}"] [data-string="${noteData.string}"] [data-beat="${noteData.beat}"]`
            );
            if (noteSpace) {
                noteSpace.textContent = noteData.fret;
                noteSpace.title = noteData.note; // Add tooltip with correct note name
                noteData.element = noteSpace;  // Store reference for game logic
            }
        });
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Only accept letter keys A-G (both upper and lowercase)
            if (e.key.length === 1 && e.key.match(/[A-Ga-g]/) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.handleNoteInput(e.key);  // Keep original case (uppercase = natural, lowercase = flat)
            }
        });
    }
    
    handleNoteInput(key) {
        const currentNote = this.notes[this.currentNoteIndex];
        const wasCorrect = key === currentNote.note;
        
        // Track performance for spaced repetition
        this.trackPerformance(currentNote.string, currentNote.fret, currentNote.note, wasCorrect);
        
        // Flash the user's input on the note
        this.flashUserInput(currentNote.element, key);
        
        if (wasCorrect) {
            // Correct answer
            currentNote.element.classList.add('correct');
            currentNote.element.classList.remove('current');
        } else {
            // Incorrect answer
            currentNote.element.classList.add('incorrect');
            currentNote.element.classList.remove('current');
        }
        
        // Move to next note
        this.currentNoteIndex++;
        
        if (this.currentNoteIndex < this.notes.length) {
            this.highlightCurrentNote();
        } else {
            // Game complete - auto-generate new exercise after a short delay
            setTimeout(() => {
                this.restartWithNewNotes();
            }, 1500);
        }
    }
    
    highlightCurrentNote() {
        // Remove current highlighting from all notes
        this.notes.forEach(note => {
            if (note.element) {
                note.element.classList.remove('current');
            }
        });
        
        // Add current highlighting to the current note
        if (this.currentNoteIndex < this.notes.length) {
            const currentNote = this.notes[this.currentNoteIndex];
            if (currentNote.element) {
                currentNote.element.classList.add('current');
            }
        }
    }
    
    restartWithNewNotes() {
        // Reset game state
        this.currentNoteIndex = 0;
        
        // Generate new random notes
        this.notes = this.generateRandomNotes();
        
        // Clear all visual states
        document.querySelectorAll('.note-space').forEach(space => {
            space.classList.remove('current', 'correct', 'incorrect');
        });
        
        // Repopulate the tablature with new notes
        this.populateTabFromNotes();
        
        // Start the new game
        this.highlightCurrentNote();
    }
    
    flashUserInput(element, userInput) {
        // Temporarily store the original content
        const originalContent = element.textContent;
        
        // Show the user's input
        element.textContent = userInput;
        element.classList.add('user-input-flash');
        
        // Restore original content after a brief delay
        setTimeout(() => {
            element.textContent = originalContent;
            element.classList.remove('user-input-flash');
        }, 300);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FretboardLearner();
});
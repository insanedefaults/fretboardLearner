# Fretboard Learner - Claude Development Notes

## Project Overview
A web-based guitar fretboard learning game built with pure HTML, CSS, and JavaScript. The game uses spaced repetition to help users memorize note positions on the guitar neck.

## Architecture & Design Decisions

### Core Game Mechanics
- **Sequential note presentation**: User progresses through 8 notes (2 measures, 4 notes each)
- **Keyboard input system**: 
  - Uppercase letters (A-G) = natural notes
  - Lowercase letters (a-g) = flat notes
- **Visual feedback**: Blue circle for current note, green for correct, red for incorrect
- **Input flash**: Yellow flash briefly shows what key was pressed

### Technical Implementation

#### Note Generation System
```javascript
// Deterministic fretboard calculation instead of static mapping
this.openStrings = ['E', 'B', 'G', 'D', 'A', 'E'];  // High to low
this.chromaticScale = ['C', 'd', 'D', 'e', 'E', 'F', 'g', 'G', 'a', 'A', 'b', 'B'];

getNoteForStringAndFret(string, fret) {
    const openNote = this.openStrings[string];
    const openNoteIndex = this.chromaticScale.indexOf(openNote);
    const newNoteIndex = (openNoteIndex + fret) % 12;
    return this.chromaticScale[newNoteIndex];
}
```

#### Spaced Repetition Algorithm
- **Rolling window**: Tracks last 50 attempts to prevent old mistakes from haunting users
- **Recency weighting**: More recent attempts weighted higher (exponential decay: 0.8^n)
- **Difficulty scoring**: Success rate converted to weight (0.0 success → 5x weight, 1.0 success → 0.2x weight)
- **Weighted selection**: Notes with higher difficulty weights appear more frequently

#### Data Structure
```javascript
// Notes stored in playing order (beat by beat)
this.notes = [
    { measure: 0, beat: 0, string: 0, fret: 0, note: 'E' },
    // ... etc
];

// Performance tracking
this.recentPerformance = [
    { noteKey: "0-0", string: 0, fret: 0, note: 'E', wasCorrect: true, timestamp: Date.now() }
];
```

### UI/UX Features
- **Hover tooltips**: Show correct answer on mouseover (using `title` attribute)
- **Responsive design**: Grid layout for instructions, mobile-friendly
- **Clean tablature display**: String labels separate from measures, connected with visual borders
- **Auto-restart**: New exercise generates automatically after completing 8 notes

## Development Evolution

### Initial Approach (Abandoned)
- Started with scrolling tablature like Guitar Pro
- Time-based note detection with playhead
- **Problems**: Complex timing synchronization, difficult note sequencing

### Final Approach (Successful)
- Static tablature with step-by-step progression
- Generate notes in JavaScript first, then populate HTML
- **Benefits**: Simpler logic, better user control, cleaner code

### Key Refactoring Moments
1. **Static fretboard → Deterministic calculation**: Replaced hardcoded note mappings with chromatic scale math
2. **DOM searching → Direct note generation**: Generate note array first, then place in HTML using data attributes
3. **Complex timing → Simple progression**: Removed scrolling/timing for cleaner step-based gameplay

## File Structure
```
fretboardlearner/
├── index.html          # Main game interface with instructions
├── style.css           # Styling with responsive design
├── script.js           # Game logic with spaced repetition
├── README.md           # Documentation for GitHub
├── .gitignore          # Git ignore file
└── CLAUDE.md           # This file
```

## Deployment
- **Platform**: GitHub Pages
- **Method**: Deploy from main branch (no GitHub Actions needed)
- **URL**: https://insanedefaults.github.io/fretboardlearner

## Future Enhancement Ideas
- Sound/audio when notes are played
- Different difficulty levels (more frets, different tunings)
- Progress tracking/statistics
- Multiple exercise types (scales, chords)
- Timing challenges
- Sharp notation option (currently only uses flats)

## Key Learning Points
- **Spaced repetition works well for small datasets** (36 possible notes: 6 strings × 6 frets)
- **Simple progression > complex timing** for learning applications
- **Hover tooltips provide good scaffolding** without cluttering UI
- **Mobile-first responsive design essential** for accessibility
- **Pure vanilla JS keeps it simple** and fast-loading

## Testing Notes
- Works across modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive on mobile devices
- No external dependencies - fully self-contained
- Fast loading time (~5KB total)

---
*Built collaboratively with Claude (Anthropic) - December 2024*
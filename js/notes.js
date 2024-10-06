const notes = {
    'C': 'DO',
    'D': 'RÉ',
    'E': 'MI',
    'F': 'FA', 
    'G': 'SOL', 
    'A': 'LA', 
    'B': 'SI'
}

const notes_cle = {
    'sol': [
                                 "A,", "B,", 
        "C", "D", "E", "F", "G", "A",  "B",  
        "c", "d", "e", "f", "g", "a",  "b", 
        "c'"
        ],
    'fa': [
        "C,,", "D,,", "E,,", "F,,", "G,,", "A,,", "B,,", 
        "C,",  "D,",  "E,",  "F,",  "G,",  "A,",  "B,", 
        "C",   "D",   "E",
        ],
    'ut3': [
        "B,,", 
        "C,",  "D,",  "E,",  "F,",  "G,", "A,", "B,", 
        "C",   "D",   "E",   "F",   "G",  "A",  "B", 
        "c",   "d",
        ],
    'ut4': [
        "G,,", "A,,", "B,,",
        "C,",  "D,",  "E,",  "F,", "G,", "A,", "B,", 
        "C",   "D",   "E",   "F",  "G",  "A",  "B",
        ]
}

const partition_tmpl = {
    'sol' : 'X:1\nL: 1/4\n __NOTE__',
    'fa':   'V: V1 clef=bass\nL:1/4\n[V: V1] __NOTE__ ',
    'ut3':  'V: Va clef=alto\nL:1/4\n[V:Va] __NOTE__ ',
    'ut4':  'V: Vt clef=tenor\nL:1/4\n[V:Vt] __NOTE__ '
}

const score = {
    'good': 0,
    'bad': 0,
}

// note is global, but only instantiated in begin() when we know the key
let note = undefined
// timer is in fact the *id* of the time counting timer, 
// as returned by setTimeout()
let timer = undefined
// start_time stores the result of performance.now() when we start a guess,
// so we can count how much time has passed to guess one note
let start_time = undefined
// delay_result is the duration, in milliseconds, for which the result,
// good or bad, is displayed.
// FIXME: We could differentiate delays for good and bad answers. 
// FIXME: We'd stay a little longer when the result is incorrect, 
// FIXME: to better analyze the mistake and learn from it.
const delay_result = 1000
// slow_flag_timer is the duration after which the timer will turn to a 
// different color, and signify that we've been waiting for a little
// too long for an anwser.
const slow_flag_timer = 15000 // 15s
// really_slow_flag_timer is the duration after which it is considered 
// that the player took too long to answer and should be admonished for it.
// Of course this is a game and the goal is to learn, so we'll put some 
// funny emojis and phrase things gently (but sarcastically)
const really_slow_flag_timer = 30000 // 30s
// answer_times is an array storing the duration for each question.
// It is used to compute the average time it takes the player to answer.
let answer_times = []

const Note = class {
    constructor(key = 'sol') {
        this.key = key
        if (!(key in notes_cle)) {
            throw new Error(`whopla, c'est quoi cette clé ?! [${key}]`)
        }
        this.notes = notes_cle[key]
        this.previous = undefined
        const index = Math.floor(Math.random() * this.notes.length)
        this._note = this.notes[index]
    }

    get note() {
        return this._note
    }
    
    get note_name() {
        // strip , and ' characters from note, and turn it to uppercase
        return this._note.replace(/[,']/g, '').toUpperCase()
    }

    set_key(key) {
        if (key.toLocaleLowerCase() in notes_cle) {
            this.key = key
            this.notes = notes_cle[key]
        } else {
            console.log(`Mais c'est quoi cette clé bizarre ? [${key}]`)
        }
    }

    next() {
        // save previous note for the next round
        this.previous = this._note
        let new_note = this.previous
        while (new_note == this.previous) {
            const index = Math.floor(Math.random() * this.notes.length)
            new_note = this.notes[index]
        }
        // save selected note
        this._note = new_note
        return this._note
    }
}

const average = array => array.reduce((a, b) => a + b) / array.length;

const create_note_repr = () => {
    let partition = partition_tmpl[note.key]
    partition = partition.replace('__NOTE__', note.note)
    return partition
}

const update_score = () => {
    document.querySelector('.score .good').innerHTML = score['good']
    document.querySelector('.score .bad').innerHTML = score['bad']
}

const updateTimer = () => {
    const elapsed = performance.now() - start_time
    let suffix = ''
    if (elapsed > slow_flag_timer) {
        document.querySelector('.timer').classList.add('slow')
        suffix = '🥱'
    }
    if (elapsed > really_slow_flag_timer) {
        document.querySelector('.timer').classList.add('really')
        suffix = '😴💤'
    }
    const seconds = String(parseInt(elapsed / 1000 % 60, 10)).padStart(2, '0')
    const minutes = String(parseInt(elapsed / 1000 / 60, 10))
    document.querySelector('.timer').innerHTML = `${minutes}:${seconds} ${suffix}`
    timer = setTimeout(updateTimer, 1000)
}

const stopTimer = () => {
    clearTimeout(timer)
}

const clearTimer = () => {
    clearTimeout(timer)
    let timer_element = document.querySelector('.timer')
    timer_element.classList.remove('really')
    timer_element.classList.remove('slow')
    timer_element.innerHTML = '0:00'
}

const begin = (key) => {
    note = new Note(key)
    const home_section = document.querySelector('.home')
    const play_section = document.querySelector('.challenge')
    home_section.style.display = 'none'
    play_section.style.display = 'inline'
    const partition = create_note_repr()
    ABCJS.renderAbc('partition', partition, { scale: 2.0, staffwidth: 400 })
    start_time = performance.now();
    answer_times = []
    score['good'] = 0
    score['bad'] = 0
    update_score()
    timer = setTimeout(updateTimer, 1000)
}

const next = () => { 
    note.next() 
    ABCJS.renderAbc('partition', create_note_repr(), { scale: 2.0, staffwidth: 400 })
    clearTimer()
    start_time = performance.now()
    let avg = Math.floor(average(answer_times))
    document.querySelector('#avg-time-value').innerHTML = `${avg}s`
    timer = setTimeout(updateTimer, 1000)
}
const start = () => { console.log('start') }


const reset = () => {
    console.log('reset')
}

const next_note = () => {
    document.querySelector('.notes').style.display = 'flex'
    document.querySelector('#reponse').innerHTML = '&nbsp;'
    next()
}

const clickNote = (value) => {
    const clicked_note = notes[value]
    console.log(`clicked ${clicked_note}`)
    stopTimer()
    answer_times.push((performance.now() - start_time) / 1000)
    if (note.note_name === value) {
        score['good'] += 1
        if (performance.now() - start_time > slow_flag_timer) {
            const emojis = ['⌛', '🥸', '😏', '🫠', '🥵', '😼', '🏃‍♀️‍➡️', '🕸️']
            let prefix = emojis[Math.floor(Math.random() * emojis.length)]
            document.querySelector('#reponse').innerHTML = `${prefix} Il était temps ! C'était bien un <span class="good answer">${clicked_note}</span>.`
        } else {
            const emojis = ['🫡', '👏', '😃', '🐱', '🤘', '👍', '💪', '🙆‍♀️', '🤩', '😍', '🥳']
            let prefix = emojis[Math.floor(Math.random() * emojis.length)]
            document.querySelector('#reponse').innerHTML = `${prefix} Bravo, c'était bien un <span class="good answer">${clicked_note}</span> !`
        }
    } else {
        score['bad'] += 1
        const emojis = ['🤨', '🫨', '😡', '😫', '🤡', '😵', '😿', '👎', '🤷‍♂️', '🧟‍♀️', '💩']
        let prefix = emojis[Math.floor(Math.random() * emojis.length)]
        document.querySelector('#reponse').innerHTML = `${prefix} Ah non, ça n'était pas un <span class="bad answer">${clicked_note}</span>,<br />c'était un <span class="answer">${notes[note.note_name]}</span>`
    }
    update_score()
    document.querySelector('.notes').style.display = 'none'
    setTimeout(next_note, delay_result)
}

const menu = () => {
    clearTimer();
    document.querySelector('.home').style.display = 'block';
    document.querySelector('.challenge').style.display = 'none';
};

const renderHomeButtons = function () {
    ABCJS.renderAbc('lecture-sol', 'C2');
    ABCJS.renderAbc('lecture-fa', 'V: V1 clef=bass\n[V: V1]C,2');
    ABCJS.renderAbc('lecture-ut3', 'V: Va clef=alto\n[V: Va]C2');
    ABCJS.renderAbc('lecture-ut4', 'V: Vt clef=tenor\n[V: Vt]C,2');
    //let all = notes_cle['sol'].join('')
    //    ABCJS.renderAbc('test', `V: Vt clef=treble\n[V: Vt]${all}`);
    //    ABCJS.renderAbc('practice-grand', '%%staves {V1 V2}\nV: V1 clef=treble\nV: V2 clef=bass\n[V: V1]C2\n[V: V2]C,2');
};

window.onload = () => {
    'use strict';
    renderHomeButtons();
}
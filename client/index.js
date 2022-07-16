function sound(src) {
    this.sound = document.createElement("audio")
    this.sound.src = src
    this.sound.setAttribute("preload", "auto")
    this.sound.setAttribute("controls", "none")
    this.sound.style.display = "none"
    document.body.appendChild(this.sound)
    this.play = function () {
        this.sound.play()
    }
}

function shuffle(a) {
    var j, x, i
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1))
        x = a[i]
        a[i] = a[j]
        a[j] = x
    }
}

function getScore(word) {
    if (word.length < 4) {
        return 1
    } else if (word.length < 5) {
        return 3
    } else if (word.length < 6) {
        return 4
    } else if (word.length < 7) {
        return 6
    } else if (word.length < 8) {
        return 8
    } else {
        return 16
    }
}

var dictionary = []
var distrib = ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'N', 'N', 'N', 'N', 'N', 'N', 'R', 'R', 'R', 'R', 'R', 'R', 'T', 'T', 'T', 'T', 'T', 'T', 'L', 'L', 'L', 'L', 'S', 'S', 'S', 'S', 'U', 'U', 'U', 'U', 'D', 'D', 'D', 'D', 'G', 'G', 'G', 'B', 'B', 'C', 'C', 'M', 'M', 'P', 'P', 'F', 'F', 'H', 'H', 'V', 'V', 'W', 'W', 'Y', 'Y', 'K', 'J', 'X', 'Q', 'Z']

fetch('https://raw.githubusercontent.com/Jamesscn/wordscramble/master/wordlist.txt').then(response => response.text()).then(text => {
    dictionary = text.split("\n")
})

var timerend = new sound("client/timer_end.wav")
var okay = new sound("client/okay.wav")
var decent = new sound("client/decent.wav")
var good = new sound("client/good.wav")
var great = new sound("client/great.wav")
var excellent = new sound("client/excellent.wav")
var epic = new sound("client/epic.wav")

function response(valid, word, score) {
    if (valid) {
        if (word.length == 3) {
            okay.play()
        } else if (word.length == 4) {
            decent.play()
        } else if (word.length == 5) {
            good.play()
        } else if (word.length == 6) {
            great.play()
        } else if (word.length == 7) {
            excellent.play()
        } else {
            epic.play()
        }
        params.data.score = score
        params.data.percent = (100 * score / params.data.totalScore).toFixed(2)
        if (params.data.usedWords.length == 0) {
            params.data.usedWords.push(word)
        } else {
            for (var i = params.data.usedWords.length - 1; i >= 0; i--) {
                if (params.data.usedWords[i].length <= word.length) {
                    params.data.usedWords.splice(i + 1, 0, word)
                    break
                }
                if (i == 0) {
                    params.data.usedWords.splice(0, 0, word)
                }
            }
        }
    }
}

var params = {
    el: "#app",
    data: {
        menu: true,
        inGame: false,
        letters: [[], []],
        usedWords: [],
        notFound: [],
        score: 0,
        totalScore: 0,
        percent: 0,
        seconds: 60,
        timer: null,
        relevantWords: []
    },
    methods: {
        start() {
            this.menu = false
            this.inGame = true
            this.letters = [[], []]
            this.usedWords = []
            this.score = 0
            this.totalScore = 0
            this.percent = 0
            this.seconds = 60
            this.timer = null
            this.relevantWords = []
            var chosenDistrib = []
            do {
                shuffle(distrib)
                chosenDistrib = distrib.slice(0, 8)
                for (var i = 0; i < dictionary.length; i++) {
                    var isValid = true
                    var tmpDistrib = chosenDistrib.slice()
                    for (var j = 0; j < dictionary[i].length; j++) {
                        var distribIndex = tmpDistrib.indexOf(dictionary[i][j].toUpperCase())
                        if (distribIndex == -1) {
                            isValid = false
                            break
                        } else {
                            tmpDistrib.splice(distribIndex, 1)
                        }
                    }
                    if (isValid && dictionary[i].length > 2 && dictionary[i].length < 9) {
                        this.relevantWords.push(dictionary[i])
                    }
                }
            } while (this.relevantWords.length == 0)
            this.relevantWords.sort((a, b) => a.length - b.length)
            for (var i = 0; i < this.relevantWords.length; i++) {
                this.totalScore += getScore(this.relevantWords[i])
            }
            this.letters = [chosenDistrib, []]
            var paramThisPtr = this
            this.timer = setInterval(function() {
                paramThisPtr.seconds--
                if (paramThisPtr.seconds == 4) {
                    timerend.play()
                }
                if (paramThisPtr.seconds == 0) {
                    clearInterval(paramThisPtr.timer)
                }
            }, 1000)
            setTimeout(function() {
                clearInterval(paramThisPtr.timer)
                paramThisPtr.inGame = false
                paramThisPtr.notFound = paramThisPtr.relevantWords
                paramThisPtr.letters = [paramThisPtr.letters[0].concat(paramThisPtr.letters[1].reverse()), []]
            }, 60000)
        },
        submit() {
            var word = this.letters[1].join("").toLowerCase()
            if (this.usedWords.indexOf(word) == -1) {
                var wordIndex = this.relevantWords.indexOf(word)
                if (wordIndex == -1) {
                    response(false, word, this.score)
                } else {
                    this.relevantWords.splice(wordIndex, 1)
                    this.score += getScore(word)
                    response(true, word, this.score)
                    if (this.relevantWords.length == 0) {
                        clearInterval(this.timer)
                        this.inGame = false
                        this.notFound = this.relevantWords
                        this.letters = [this.letters[0].concat(this.letters[1].reverse()), []]
                    }
                }
            } else {
                response(false, word, this.score)
            }
            this.letters = [this.letters[0].concat(this.letters[1].reverse()), []]
        },
        type(event) {
            if (this.inGame) {
                if (event.key == "Enter") {
                    this.submit()
                }
                if (event.key == "Backspace") {
                    if (this.letters[1].length > 0) {
                        this.letters[0].push(this.letters[1].pop())
                    }
                } else {
                    var index = this.letters[0].findIndex(function(value) {
                        return value.toLowerCase() == event.key.toLowerCase()
                    })
                    if (index != -1) {
                        this.letters[0].splice(index, 1)
                        this.letters[1].push(event.key.toUpperCase())
                    }
                }
            }
            event.preventDefault()
        }
    },
    created: function() {
        document.addEventListener("keydown", this.type)
    },
    destroyed: function() {
        document.removeEventListener("keydown", this.type)
    }
}

new Vue(params)
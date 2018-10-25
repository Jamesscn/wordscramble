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

var socket = io()
var timerend = new sound("timer_end.wav")
var okay = new sound("okay.wav")
var decent = new sound("decent.wav")
var good = new sound("good.wav")
var great = new sound("great.wav")
var excellent = new sound("excellent.wav")
var epic = new sound("epic.wav")

socket.on("response", function (value) {
    if (value.valid) {
        if (value.word.length == 3) {
            okay.play()
        } else if (value.word.length == 4) {
            decent.play()
        } else if (value.word.length == 5) {
            good.play()
        } else if (value.word.length == 6) {
            great.play()
        } else if (value.word.length == 7) {
            excellent.play()
        } else {
            epic.play()
        }
        params.data.score = value.score
        params.data.percent = (100 * value.score / params.data.totalScore).toFixed(2)
        if (params.data.usedWords.length == 0) {
            params.data.usedWords.push(value.word)
        } else {
            for (var i = params.data.usedWords.length - 1; i >= 0; i--) {
                if (params.data.usedWords[i].length <= value.word.length) {
                    params.data.usedWords.splice(i + 1, 0, value.word)
                    break
                }
                if (i == 0) {
                    params.data.usedWords.splice(0, 0, value.word)
                }
            }
        }
    }
})

socket.on("begin", function (value) {
    params.data.letters = [value.chosenDistrib, []]
    params.data.totalScore = value.totalScore
    params.data.timer = setInterval(function () {
        params.data.time--
        if (params.data.time == 4) {
            timerend.play()
        }
        if (params.data.time == 0) {
            clearInterval(params.data.timer)
        }
    }, 1000)
})

socket.on("end", function (remaining) {
    clearInterval(params.data.timer)
    params.data.inGame = false
    params.data.notFound = remaining
    params.data.letters = [params.data.letters[0].concat(params.data.letters[1].reverse()), []]
})

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
        time: 60,
        timer: null
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
            this.time = 60
            this.timer = null
            socket.emit("begin")
        },
        submit() {
            socket.emit("submit", this.letters[1].join("").toLowerCase())
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
                    var index = this.letters[0].findIndex(function (value) {
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
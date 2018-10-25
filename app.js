var express = require("express")
var app = express()
var ejs = require("ejs")
var http = require("http").Server(app)
var io = require("socket.io")(http)
var fs = require("fs")

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

const port = 80

app.use(express.static("client"))
app.set("view engine", "ejs")

var dictionary = []
var distrib = ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'N', 'N', 'N', 'N', 'N', 'N', 'R', 'R', 'R', 'R', 'R', 'R', 'T', 'T', 'T', 'T', 'T', 'T', 'L', 'L', 'L', 'L', 'S', 'S', 'S', 'S', 'U', 'U', 'U', 'U', 'D', 'D', 'D', 'D', 'G', 'G', 'G', 'B', 'B', 'C', 'C', 'M', 'M', 'P', 'P', 'F', 'F', 'H', 'H', 'V', 'V', 'W', 'W', 'Y', 'Y', 'K', 'J', 'X', 'Q', 'Z']

fs.readFile("wordlist.txt", "utf8", function (err, contents) {
    dictionary = contents.split("\n")
})

io.on("connection", function (socket) {
    var relevantWords = []
    var usedWords = []
    var score = 0
    var totalScore = 0
    var chosenDistrib = []
    socket.on("begin", function () {
        relevantWords = []
        usedWords = []
        score = 0
        totalScore = 0
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
                    relevantWords.push(dictionary[i])
                }
            }
        } while (relevantWords.length == 0)
        relevantWords.sort((a, b) => a.length - b.length)
        for (var i = 0; i < relevantWords.length; i++) {
            totalScore += getScore(relevantWords[i])
        }
        socket.emit("begin", {
            chosenDistrib: chosenDistrib,
            totalScore: totalScore
        })
        setTimeout(function () {
            socket.emit("end", relevantWords)
        }, 60000)
    })
    socket.on("submit", function (word) {
        if (usedWords.indexOf(word) == -1) {
            var wordIndex = relevantWords.indexOf(word)
            if (wordIndex == -1) {
                socket.emit("response", {
                    valid: false,
                    word: word,
                    score: score
                })
            } else {
                relevantWords.splice(wordIndex, 1)
                usedWords.push(word)
                score += getScore(word)
                socket.emit("response", {
                    valid: true,
                    word: word,
                    score: score
                })
                if (relevantWords.length == 0) {
                    socket.emit("end", relevantWords)
                }
            }
        } else {
            socket.emit("response", {
                valid: false,
                word: word,
                score: score
            })
        }
    })
})

app.get("/", function (req, res) {
    res.render("index")
})

http.listen(port)
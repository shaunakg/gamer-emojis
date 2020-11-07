var express = require('express');
var app = express();
var http = require('http').createServer(app);
var fs = require('fs');
const webport = process.env.PORT || 8080;

app.use(require('express-useragent').express())

const block_html_location = "block.html";

// ::ffff:10.37.246.199
// ::ffff:10.5.185.29
// ::ffff:10.45.9.232
// ::ffff:10.97.235.153


const denylist = [
    {
        ip: "::ffff:10.41.198.134",
        name: "Hugo",
        reason: "You keep showing off your emojis on iphone like come on bro not all of us can afford the duplex iphone pro max xs vibrator edition"
    },
    {
        ip: "10.41.198.134",
        name: "Hugo",
        reason: "You keep showing off your emojis on iphone like come on bro not all of us can afford the duplex iphone pro max xs vibrator edition"
    },
    {
        ip: "::ffff:10.37.246.199",
        name: "Hugo",
        reason: "You keep showing off your emojis on iphone like come on bro not all of us can afford the duplex iphone pro max xs vibrator edition"
    },
    {
        ip: "::ffff:10.5.185.29",
        name: "Hugo",
        reason: "You keep showing off your emojis on iphone like come on bro not all of us can afford the duplex iphone pro max xs vibrator edition"
    },
    {
        ip: "::ffff:10.45.9.232",
        name: "Hugo",
        reason: "You keep showing off your emojis on iphone like come on bro not all of us can afford the duplex iphone pro max xs vibrator edition"
    },
    {
        ip: "::ffff:10.97.235.153",
        name: "Hugo",
        reason: "You keep showing off your emojis on iphone like come on bro not all of us can afford the duplex iphone pro max xs vibrator edition"
    },

    {
        ip: "49.176.231.97",
        name: "Aksaya",
        reason: "Hugo's block wasn't working"
    }

];

const denyListIncludes = (ip) => {
    for (i = 0; i < denylist.length; i++) {
        if (denylist[i].ip == ip || denylist[i] == ip.replace("::ffff:", "")) {
            return denylist[i];
        }
    }

    return false;
}

function emojiUnicode (emoji) {
    var comp;
    if (emoji.length === 1) {
        comp = emoji.charCodeAt(0);
    }
    comp = (
        (emoji.charCodeAt(0) - 0xD800) * 0x400
      + (emoji.charCodeAt(1) - 0xDC00) + 0x10000
    );
    if (comp < 0) {
        comp = emoji.charCodeAt(0);
    }
    return comp.toString("16");
};

app.use((req, res, next) => {

    if (denyListIncludes(req.headers['x-forwarded-for'] || req.connection.remoteAddress)) {
        let denyobject = denyListIncludes(req.headers['x-forwarded-for'] || req.connection.remoteAddress);

        return fs.readFile(block_html_location, (err, data) => {

            console.log("File is read.");

            let finalMsg = data.toString().replace(
                "[[MESSAGE]]",
                `Hello ${denyobject.name}. You are currently on ${req.useragent.platform} (more specifically, ${req.useragent.os}) with the ${req.useragent.browser} browser. You've been blocked from the emoji service for the following reason: "${denyobject.reason}".`
            )
    
            return res.send(finalMsg)
        });

    } else { next() }

});

app.get("/preflight", (req, res) => {
    res.end("application error");
    console.log("PREFLIGHT FOUND REMOTE ADDRESS: " + (req.headers['x-forwarded-for'] || req.connection.remoteAddress))
})

app.get("/", (req, res) => {
    res.end(`<!doctype html><html>Welcome to gamer emojis. Use like so: https://${req.get('host')}/&#128540;</html>`)
});

app.get("/for/hugo/only/because/he/is/quite/smexy", (req, res) => {
    console.log(`HUGO IP ADDRESS HELLLLO: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`)
})

app.get("/:emoji", (req, res) => {
    console.log("PREFLIGHT FOUND REMOTE ADDRESS: " + (req.headers['x-forwarded-for'] || req.connection.remoteAddress))
    res.sendFile(__dirname + `/emojis/${emojiUnicode(req.params.emoji).toUpperCase()}.svg`);
})

http.listen(webport, function(){
    console.log('listening on *:' + webport);
});
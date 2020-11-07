var express = require('express');
var app = express();
var http = require('http').createServer(app);
var fs = require('fs');
const webport = process.env.PORT || 8080;

app.use(require('express-useragent').express())

const block_html_location = "block.html";

const denylist = [
    {
        ip: "",
        name: "Hugo",
        reason: "You keep showing off your emojis!"
    }
];

const denyListIncludes = (ip) => {
    for (i = 0; i < denylist.length; i++) {
        if (denylist[i].ip == ip) {
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

    if (denyListIncludes(req.connection.remoteAddress)) {
        let denyobject = denyListIncludes(req.connection.remoteAddress);

        fs.readFile(block_html_location, (err, data) => {

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
    console.log("PREFLIGHT FOUND REMOTE ADDRESS: " + req.connection.remoteAddress)
})

app.get("/", (req, res) => {
    res.end(`<!doctype html><html>Welcome to gamer emojis. Use like so: https://${req.get('host')}/&#128540;</html>`)
});

app.get("/:emoji", (req, res) => {
    res.sendFile(__dirname + `/emojis/${emojiUnicode(req.params.emoji)}.svg`);
})

http.listen(webport, function(){
    console.log('listening on *:' + webport);
});
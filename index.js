var express = require('express');
var app = express();
var http = require('http').createServer(app);
var fs = require('fs');
const webport = process.env.PORT || 8080;

let cache = {populatedTime: 0, content: {}};

const fetch = require('node-fetch');

app.use(require('express-useragent').express())

const block_html_location = "block.html";
const head = `
<!doctype html>
<head>
<title>[[TITLE]]</title>
<meta name="description" content="[[DESCRIPTION]]">
</head><body>
`;

// ::ffff:10.37.246.199
// ::ffff:10.5.185.29
// ::ffff:10.45.9.232
// ::ffff:10.97.235.153

const crawler_uas = ["facebookexternalhit", "cortex"];

const denylist = [
    {
        ip: "61.68.254.19",
        name: "Hugo",
        reason: "Is hugo"
    },

    // {
    //     ip: "49.176.231.97",
    //     name: "Aksaya",
    //     reason: "Hugo's block wasn't working"
    // }

];

const denyListIncludes = (ip) => {
    for (i = 0; i < denylist.length; i++) {
        if (denylist[i].ip == ip || denylist[i] == ip.replace("::ffff:", "")) {
            return denylist[i];
        }
    }

    return false;
}  

const stringIncludesItemInList = (s, l) => {
    for (i = 0; i < l.length; i++) {
        if (s.includes(l[i])) {
            return true;
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

    console.log("Connection from remote origin: " + (req.headers['x-forwarded-for'] || req.connection.remoteAddress) + ", user agent " + req.useragent.source)

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
    console.log("Specific PREFLIGHT remote addr: " + (req.headers['x-forwarded-for'] || req.connection.remoteAddress) + ", user agent " + req.useragent.source)
    res.end("application error");
})

app.get("/", (req, res) => {
    if (stringIncludesItemInList(req.useragent.source, crawler_uas)) {

        return res.send(
            head.replace("[[TITLE]]", "So, you're a cool person. You're lookin for some spicy emojis.")
                .replace("[[DESCRIPTION]]", `The normal ones just aren't cutting it for you. Well, you've come to the right place. Check out GamerEmojis.`)
            + `Welcome to gamer emojis. Use like so: https://${req.get('host')}/&#128540;</body></html>`
        )

    }

    return res.sendFile(__dirname + "/index.html");
});

app.get("/s/:slug", async (req, res) => {

    let dict = {}
    let fromCache;

    if (new Date().getTime() - cache.populatedTime > 600000 || req.query.cache == "0") {
        let response = await fetch("https://docs.google.com/spreadsheets/d/1g1BhiYhla_4BfD5drp_oKZmYLaAWdsA29zcQT5NKsDs/export?format=tsv")
        let lines = (await response.text()).split("\n")

        lines.shift()

        for (i = 0; i<lines.length; i++) {
            let line = lines[i].split("\t");
            dict[line[2].replace("\r", "")] = line[1].replace("\r","");
        }

        cache = {
            populatedTime: new Date().getTime(),
            content: dict
        }

        fromCache = true;

    } else {
        dict = cache.content;
        fromCache = false;
    }

    if (dict[req.params.slug]) {
        return res.set({'X-Cache': fromCache ? "HIT":"MISS", "X-Is-Special-Link": "TRUE"}).redirect(301, dict[req.params.slug])
    } else {
        var reqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        let fullUrl = `https://docs.google.com/forms/d/e/1FAIpQLSesUJmIa_DFjrLUb-6TuSQA773gxvtuWabwzuuExTk-PD_S5g/viewform?usp=pp_url&entry.1958630459=${encodeURIComponent(req.params.slug)}&entry.1255600363=You+went+to+an+nonexistent+URL+(${encodeURIComponent(reqUrl)})+and+are+being+redirected+so+you+can+make+it+a+valid+one+if+you+want.Just+fill+in+the+very+first+field.`;
        return res.set({"X-Is-Special-Link": "FALSE"}).redirect(fullUrl);
    }

});

app.get("/:emoji", (req, res) => {
    if (stringIncludesItemInList(req.useragent.source, crawler_uas)) {

        return res.send(
            head.replace("[[TITLE]]", "So, you're a cool person. You're lookin for some spicy emojis.")
                .replace("[[DESCRIPTION]]", `The normal ${req.params.emoji} emoji just isn't cutting it for you. Well, you've come to the right place. Check out Extended Emojis.`)
            + `</body></html>`
        )

    }

    let fn = __dirname + `/emojis/${emojiUnicode(req.params.emoji).toUpperCase()}.svg`;

    if (fs.existsSync(fn)) {
        return res.sendFile(fn);
    } else {
        res.status(404).sendFile(__dirname + "/404.html");
    }
})

http.listen(webport, function(){
    console.log('listening on *:' + webport);
});

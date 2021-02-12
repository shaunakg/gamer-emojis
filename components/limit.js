
// The rate limit ensures that the database doesn't receive erroneous read or write requests from bots.
// e.g, if somebody kept on pinging the /api/survey/:shortId endpoint, the database would recieve hundreds of write requests.

// rate_limit_milliseconds is defined in the configuration file. It means the number of milliseconds before a client can connect again.
// rate_limit_variation is defined in the configuration file. It means the scale factor by which the random change will be multiplied.

const express = require("express");
var { rate_limit_milliseconds, rate_limit_variation } = process.env;

rate_limit_milliseconds = parseFloat(rate_limit_milliseconds);
rate_limit_variation = parseFloat(rate_limit_variation);

const router = express.Router();

// We're just storing rate-limited IPs in the memory because they usually only stay there for a second or so. 
// For anything serious we would want a database that kept track of it. 
// But if we used the DB for every rate-limited request... it would sorta defeat the purpose.
// TODO: local cache like Redis?
let ips = []; 

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// This is to fuzz the rate limit a little bit. If we actually set it to (say) 1s, then somebody could ping every one second.
// This way, the rate limit gets randomly selected from a variation seed. If the seed is 1, the rate limit could be 0 to double the original limit.
// Although usually the variation should be set to something like 0.5 so users don't notice that much but bots stumble.
function getRateLimitActual(ms, variation) {
    return ms + getRandomArbitrary(-1 * variation * ms, variation * ms)
}

// Trigger this callback for every HTTP method and every route available.
// This will also stop browsers from loading favicons. But this is an API server so it shouldn't be a problem.
router.all("*", (req, res, next) => {

    const rateLimitActual = getRateLimitActual(rate_limit_milliseconds, rate_limit_variation);

    if ( !ips.includes(req.socket.remoteAddress)) {

        ips.push(req.socket.remoteAddress);

        setTimeout((ip) => {
            ips.splice(ips.indexOf(ip), 1)
        }, parseInt(rateLimitActual), req.socket.remoteAddress)

        return next();

    } else {

        return res
        .status(429) // HTTP 429 - Too Many Requests.
        .render('httperror', {
            status: 429,
            title: "Too many requests.",
            message: `You're sending too many requests. Please wait ${Math.round(rateLimitActual/100)/10} seconds to try again.`,
            diagnostics: require('../index').getDiags(req)
        });
    }
})

module.exports = router;
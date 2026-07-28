const STYLE_ID = "tg-color-themes";
const default_theme = [131, 120, 219];

// RGB offsets from the accent colour, kept from the original tuning
let color_primary_shade_k = [-8, -7, -21];
let color_primary_shade_darker_k = [-16, -14, -42];
let color_links_k = [3, 21, 27];
let color_links_hover_k = [-24, -25, -15];
let color_reply_own_hover_k = [-31, -32, -31];
let color_reply_own_active_k = [-52, -46, -60];

let color_theme = null;  // stays null until the user picks a colour
let color_primary = default_theme.slice(0);

let rainbow_id = 0;
let rainbow_speed = 1;
let rainbow_saturation = 0.8;
let rainbow_value = 0.5;

const hex2rgb = hex =>
     hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        ,(m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16));

function hsv2rgb(h, s, v) {
    let f = (n, k=(n + h / 60) % 6) =>
        v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function accent() {
    return color_theme ? color_theme.slice(0) : default_theme.slice(0);
}

chrome.storage.sync.get(['color_theme', 'r_mode', 'r_speed', 'r_saturation', 'r_value'], function (result) {
    if (result.color_theme)
        color_theme = hex2rgb(result.color_theme);
    if (result.r_speed !== undefined)
        rainbow_speed = result.r_speed;
    if (result.r_saturation !== undefined)
        rainbow_saturation = result.r_saturation;
    if (result.r_value !== undefined)
        rainbow_value = result.r_value;

    if (result.r_mode) {
        rainbow_id = rainbowStart();
    }
    else {
        color_primary = accent();
        changeTheme();
    }
});

chrome.runtime.onMessage.addListener(function(request) {
    if (request.color !== undefined) {
        color_theme = hex2rgb(request.color);
        color_primary = accent();
        changeTheme();
    }
    else if (request.r_mode !== undefined) {
        if (request.r_mode) {
            if (!rainbow_id)
                rainbow_id = rainbowStart();
        }
        else {
            clearInterval(rainbow_id);
            rainbow_id = 0;
            color_primary = accent();
            changeTheme();
        }
    }
    else if (request.r_speed !== undefined)
        rainbow_speed = request.r_speed;
    else if (request.r_saturation !== undefined)
        rainbow_saturation = request.r_saturation;
    else if (request.r_value !== undefined)
        rainbow_value = request.r_value;
});

function saveRChanges() {
    if (!rainbow_id)
        return;
    chrome.storage.sync.set({r_speed: rainbow_speed, r_saturation: rainbow_saturation, r_value: rainbow_value}, () => {});
}
setInterval(saveRChanges, 5000);

function clamp(x) {
    return Math.min(255, Math.max(0, Math.round(x)));
}

function modK(arr) {
    return color_primary.map((c, i) => clamp(c + arr[i]));
}

function rgbWrap(arr) {
    return `rgb(${arr.join(', ')})`;
}

function buildCss() {
    let primary = color_primary.map(clamp);
    let shade = modK(color_primary_shade_k);
    let shadeDarker = modK(color_primary_shade_darker_k);
    let links = modK(color_links_k);
    let linksHover = modK(color_links_hover_k);
    let replyHover = modK(color_reply_own_hover_k);
    let replyActive = modK(color_reply_own_active_k);

    let vars = {
        "--color-primary":                  rgbWrap(primary),
        "--color-chat-active":              rgbWrap(primary),
        "--color-green":                    rgbWrap(primary),
        "--color-green-rgb":                primary.join(', '),
        "--color-green-darker":             rgbWrap(shade),
        "--color-text-meta-colored":        rgbWrap(primary),
        "--color-background-own":           rgbWrap(primary),
        "--color-background-own-apple":     rgbWrap(primary),

        "--color-primary-shade":            rgbWrap(shade),
        "--color-primary-shade-darker":     rgbWrap(shadeDarker),
        "--color-primary-shade-rgb":        shade.join(', '),
        "--color-background-own-selected":  rgbWrap(shade),

        "--color-links":                    rgbWrap(links),
        "--color-links-hover":              rgbWrap(linksHover),
        "--color-reply-own-hover":          rgbWrap(replyHover),
        "--color-reply-own-hover-apple":    rgbWrap(replyHover),
        "--color-reply-own-active":         rgbWrap(replyActive),
        "--color-reply-own-active-apple":   rgbWrap(replyActive),
    };

    let decls = Object.keys(vars).map(k => `${k}:${vars[k]} !important;`).join('');
    // Telegram defines the light palette inside @layer variables{:root{...}} and the
    // dark one in an unlayered .component-theme-dark{...} rule. An unlayered !important
    // rule matching both selectors is the only thing that outranks each of them.
    return `:root,.component-theme-dark{${decls}}`;
}

function changeTheme() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = buildCss();
}

function rainbowStart() {
    let i = 0;
    function setColor() {
        if (i > 360)
            i = 0;
        color_primary = hsv2rgb(i, rainbow_saturation, rainbow_value);
        changeTheme();
        i += rainbow_speed;
    }
    return setInterval(setColor, 100);
}

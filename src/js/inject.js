let color_theme = null;
let default_theme = [131, 120, 219];

let color_primary = default_theme;
let color_primary_shade_k = [-8, -7, -21];
let color_links_k = [3, 21, 27];
let color_links_hover_k = [-24, -25, -15];
let color_reply_own_hover_k = [-31, -32, -31];
let color_reply_own_active_k = [-52, -46, -60];

let rainbow_id = null;
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

chrome.storage.sync.get(['color_theme'], function (result) {
    if (result.color_theme) {
        color_theme = hex2rgb(result.color_theme);
        color_primary = color_theme.slice(0);
    }
    else
        color_primary = default_theme.slice(0);
    changeTheme();
});

chrome.runtime.onMessage.addListener(function(request) {
    if (request.color) {
        color_theme = hex2rgb(request.color);
        color_primary = color_theme.slice(0);
        changeTheme();
    }
    else if (request.r_mode !== undefined)
        if (request.r_mode) {
            rainbow_id = rainbowStart();
        }
        else {
            clearInterval(rainbow_id);
            rainbow_id = 0;
            color_primary = color_theme.slice(0);
            changeTheme();
        }
    else if (request.r_speed)
        rainbow_speed = request.r_speed;
    else if (request.r_saturation)
        rainbow_saturation = request.r_saturation;
    else if (request.r_value)
        rainbow_value = request.r_value;
});

function saveRChanges() {
    if (!rainbow_id)
        return;
    chrome.storage.sync.set({r_speed: rainbow_speed, r_saturation: rainbow_saturation, r_value: rainbow_value}, () => {});
}
setInterval(saveRChanges, 5000);

function rgbWrap(arr) {
    return `rgb(${arr.join(',')})`;
}

function modK(arr, wrap=true) {
    let temp = color_primary.slice(0);
    temp.forEach((_, i) => {
        temp[i] += arr[i];
        if (temp[i] < 0)
            temp[i] = 0;
    });
    if (wrap)
        temp = rgbWrap(temp);
    return temp;
}

function changeTheme() {
    let elem = document.getElementsByClassName("theme-dark")[0];
    if (!elem)  // there must be a separate handler for light theme
        return;
    let elemCss = elem.style['cssText'].split('; ');
    for (let i = 0; i < elemCss.length; i++) {
        let attr = elemCss[i].slice(0, elemCss[i].indexOf(':'));
        switch (attr) {
            case "--color-primary":                 elemCss[i] = attr + ':' + rgbWrap(color_primary);         break;
            case "--color-chat-active":             elemCss[i] = attr + ':' + rgbWrap(color_primary);         break;
            case "--color-green":                   elemCss[i] = attr + ':' + rgbWrap(color_primary);         break;
            case "--color-text-meta-colored":       elemCss[i] = attr + ':' + rgbWrap(color_primary);         break;
            case "--color-background-own":          elemCss[i] = attr + ':' + rgbWrap(color_primary);         break;
            case "--color-primary-opacity":         elemCss[i] = attr + ':' + rgbWrap(color_primary);         break;

            case "--color-primary-shade":           elemCss[i] = attr + ':' + modK(color_primary_shade_k);    break;
            case "--color-background-own-selected": elemCss[i] = attr + ':' + modK(color_primary_shade_k);    break;

            case "--color-links":                   elemCss[i] = attr + ':' + modK(color_links_k);            break;
            case "--color-links-hover":             elemCss[i] = attr + ':' + modK(color_links_hover_k);      break;
            case "--color-reply-own-hover":         elemCss[i] = attr + ':' + modK(color_reply_own_hover_k);  break;
            case "--color-reply-own-active":        elemCss[i] = attr + ':' + modK(color_reply_own_active_k); break;
        }
    }
    elem.style = elemCss.join('; ');
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

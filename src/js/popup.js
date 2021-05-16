let color_theme = null;
let default_theme = "#8378db";
let r_mode = null;
let r_speed = null;
let r_saturation = null;
let r_value = null;

let colorPicker = document.getElementById("color-picker");
let header = document.getElementById("header");
let rainbow_checkbox = document.getElementById("rainbow-checkbox");
let rainbow_speed = document.getElementById("rainbow-speed");
let rainbow_saturation = document.getElementById("rainbow-saturation");
let rainbow_value = document.getElementById("rainbow-value");
let rainbow_settings = document.getElementById("rainbow-settings");
colorPicker.addEventListener("input", watchColorPicker);
colorPicker.addEventListener("change", saveColorPicker);
rainbow_checkbox.addEventListener("change", sendRainbow);
rainbow_speed.addEventListener("input", sendRSpeed);
rainbow_saturation.addEventListener("input", sendRSaturation);
rainbow_value.addEventListener("input", sendRValue);

chrome.storage.sync.get(['color_theme', 'r_mode', 'r_speed', 'r_saturation', 'r_value'], function (result) {
    color_theme = result.color_theme;
    if (!color_theme)
        color_theme = default_theme;
    r_mode = result.r_mode;
    r_speed = result.r_speed ? result.r_speed : 0;
    r_saturation = result.r_saturation ? result.r_saturation : 0;
    r_value = result.r_value ? result.r_value : 0;
    header.style.background = color_theme;
    colorPicker.value = color_theme;
    rainbow_speed.value = r_speed * 10;
    rainbow_saturation.value = r_saturation * 10;
    rainbow_value.value = r_value * 10;
    if (r_mode)
        rainbow_checkbox.checked = true;
    else
        rainbow_settings.style.display = "none";
});

function watchColorPicker(event) {
    if (r_mode) {
        r_mode = false;
        rainbow_checkbox.checked = false;
        saveRainbow();
    }
    let color = event.target.value;
    sendMessage({"color": color});
    header.style.background = color;
}

function sendMessage(data) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        let activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, data);
    });
}
function saveData(data) {
    chrome.storage.sync.set(data, () => {});
}

function saveColorPicker(event) {
    saveData({color_theme: event.target.value});
}

function saveRainbow() {
    saveData({r_mode: r_mode});
    sendMessage({r_mode: r_mode});
    if (r_mode)
        rainbow_settings.style.display = "block";
    else
        rainbow_settings.style.display = "none";
}
function sendRainbow(event) {
    r_mode = event.target.checked;
    saveRainbow();
}

function sendRSpeed(event) {
    let speed = event.target.value / 10;
    document.getElementById("rainbow-speed-text").innerHTML = speed.toString();
    sendMessage({r_speed: speed});
}
function sendRSaturation(event) {
    sendMessage({r_saturation: event.target.value / 10});
}
function sendRValue(event) {
    sendMessage({r_value: event.target.value / 10});
}
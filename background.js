//http://kemeko0809.hatenablog.com/entry/2013/10/07/105415
var currentRequest = null;
var wait = null;
var string = null;

chrome.omnibox.onInputChanged.addListener(
    function(text, suggest) {
        string = text;

        if (!wait) {
            wait = setTimeout(function(suggest) {
                wait = null;
                dispatch(suggest);
            }, 500, suggest);
        }

    }
);

function dispatch(suggest) {

    updateDefaultSuggestion(string);
    if (string == '') return ;

    currentRequest = search(string, function(responseText) {
        // http://d.hatena.ne.jp/furyu-tei/20100612/1276275088#trap_point2
        // xPath //*[@id="rso"]/li[1]/div/div/div/span

        var dom = html2Dom(responseText);

        var result = [];
        var els = dom.querySelectorAll('#rso>li');
        var num = (els.length < 5)? els.length: 5;
        for (var i = 0; i < num; i++) {
            var el = els[i];

            if (el.id == 'newsbox') continue;

            var title = el.querySelectorAll('div.rc>h3>a')[0].innerHTML;
            title = title
                .replace(/by.*$/, '')
                .replace(/em>/g, 'match>')
                .replace(/\:\,;/g, '');
            var url = el.querySelectorAll('div.rc>h3>a')[0].href
            url = url.replace(/&/, '&amp;');
            var content = el.querySelectorAll('div>div>div>span')[0].innerText;
            var description = title + '<url>' + url + '</url>';

            if (content.length < 1) continue;

            result.push({
                content: url,
                description: description
            });

        }
        suggest(result);
    });
}

function html2Dom(html) {
    var dom = document.implementation.createHTMLDocument('');
    var html = ['<html><body>',
                html.match(/<body[^>]*>([\s\S]*)<\/body/i)[1],
                '</body></html>'].join('');
    var range = dom.createRange();
    range.selectNodeContents(dom.documentElement);
    range.deleteContents();
    dom.documentElement.appendChild(range.createContextualFragment(html));
    return dom;
}

function resetDefaultSuggestion() {
    chrome.omnibox.setDefaultSuggestion({
        description: '<url><match>rs:</match></url> Recipe search'
    });
}

resetDefaultSuggestion();

function updateDefaultSuggestion(text) {
    resetDefaultSuggestion();
}

chrome.omnibox.onInputStarted.addListener(function() {
    resetDefaultSuggestion();
});

chrome.omnibox.onInputCancelled.addListener(function() {
    resetDefaultSuggestion();
});

function search(query, callback) {
    var s = string;
    // http://ajax.googleapis.com/ajax/services/search/web?
    // v=1.0&q=%E7%89%9B%E3%81%99%E3%81%98%E7%85%AE%E8%BE%BC%E3%81%BF
    // +inurl%3Acookpad.com%2Frecipe
    var url = ['https://www.google.com/search?',
               'q=' + encodeURI(string) + '&',
               'hq=inurl%3Acookpad.com%2Frecipe'].join('');
    var referer = 'https://www.google.com/';
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            callback(req.responseText);
        }
    }
    req.send(null);
    return req;
}

function navigate(url) {
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true
        },
        function(tabs) {
            chrome.tabs.update(tabs[0].id, { url: url });
        });
}

chrome.omnibox.onInputEntered.addListener(function(text) {
    if (/^http/.test(text)) {
        url = text;
    } else {
        url = ['https://www.google.com/search?',
               'q=' + encodeURI(text) + '&',
               'hq=inurl%3Acookpad.com%2Frecipe'].join('');
    }
    navigate(url);
});

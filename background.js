/*GOOGLE ANALYTICS*/
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-72704652-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();
/*END OF GOOGLE ANALYTICS*/

chrome.storage.sync.get(function(grab){
    var number_of_links = Object.keys(grab).length;
    var counter = 0;
    for(var j in grab){
        if(JSON.stringify(grab[j]).indexOf("**NOTE**") != -1){
            counter++;
        }
    }
    chrome.browserAction.setBadgeBackgroundColor({color:'#283593'});
    var remaining = number_of_links - counter;
    if(remaining > 0){
        chrome.browserAction.setBadgeText({text: '' + remaining});
    }
});

chrome.contextMenus.create({
    "title": "Save to Link Saver",
    "type": "normal",
    "contexts": ["image", "link"],
    "onclick": function (result) {
        _gaq.push(['_trackEvent', 'right_click_save', 'clicked']);
        chrome.storage.sync.get(result.linkUrl, function (is_it_there) {
            if (Object.keys(is_it_there).length == 0) {
                $.ajax(result.linkUrl)
                    .done(function (html) {
                        // create pseudo div
                        var div = document.createElement('div');
                        div.innerHTML = html;
                        var favicon = undefined;
                        var domain = extractDomain(result.linkUrl);
                        favicon = "http://www.google.com/s2/favicons?domain_url=" + domain;
                        if (favicon == undefined) {
                            favicon = "placeholder_icon.jpg";
                        }
                        var title = $(div).find('title').text();
                        var currentdate = new Date(),
                            currentdate_string = currentdate.toString(),
                            localedate_string = "$Locale$" + currentdate.toLocaleString();
                        currentdate_string = "$$Date$$" + currentdate_string + localedate_string;
                        if (title.length == 0) {
                            title = result.linkUrl;
                        }
                        if (title.length > 120) {
                            title = title.replace(title.substr(120, title.length), "...");
                        }
                        var obj = {};
                        obj[result.linkUrl] = title + currentdate_string + "$Icon: " + favicon;
                        var hist_obj = {};
                        var hist_tabURL = "#HISTORY#" + result.linkUrl;
                        hist_obj[hist_tabURL] = title + currentdate_string + "$Icon: " + favicon;
                        chrome.storage.sync.set(obj);
                        chrome.storage.local.set(hist_obj);
                        chrome.browserAction.getBadgeText({}, function (number) {
                            number++;
                            chrome.browserAction.setBadgeText({text: '' + number});
                        });
                    });
            }
        });
    }
});

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }
    //find & remove port number
    domain = domain.split(':')[0];
    if(domain.indexOf("www.") != -1){
        domain = domain.replace("www.", "");
    }
    return domain;
}
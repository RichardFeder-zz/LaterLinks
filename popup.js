/** GOOGLE ANALYTICS START */
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
function trackButton(e) {
    _gaq.push(['_trackEvent', e.target.id, 'clicked']);
}
/** GOOGLE ANALYTICS END */

var links = [];
function save_link(){
    var save_button = document.getElementById("save_link");
    save_button.addEventListener("click", function() {
        var currentdate = new Date(),
            currentdate_string = currentdate.toString(),
            localedate_string = "$Locale$" + currentdate.toLocaleString();
        currentdate_string = "$$Date$$" + currentdate_string + localedate_string;
        var tabURL;
        var tabTitle;
        var tabIcon;
        chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function (tabs) {
            tabURL = tabs[0].url;
            chrome.storage.sync.get(tabURL, function(is_it_there){
                if(Object.keys(is_it_there).length == 0){
                    tabTitle = tabs[0].title;
                    if(tabTitle.length > 120){
                        tabTitle = tabTitle.replace(tabTitle.substr(120, tabTitle.length), "...");
                    }
                    tabIcon = tabs[0].favIconUrl;
                    var tabIcon_string = "$Icon:" + tabIcon;
                    tabTitle = tabTitle + currentdate_string + tabIcon_string;
                    var obj = {};
                    obj[tabURL] = tabTitle;
                    var hist_obj = {};
                    var hist_tabURL = "#HISTORY#" + tabURL;
                    hist_obj[hist_tabURL] = tabTitle;
                    change_badge("up");
                    chrome.storage.sync.set(obj);
                    chrome.storage.local.set(hist_obj);
                    chrome.storage.sync.get(tabURL, function(result){
                        links = [];
                        $('caption').remove();
                        show_links(result);
                    });
                }
            });
        });
    });
}
function add_hyperlinks(hyperlinks_function){
    var page_title = $("title").text();
    $(hyperlinks_function).each(function() {
        if ($(this).data("event") == true) {
            return;
        }
        $(this).data("event", true);
        var td = $(this).closest("td");
        var note_title = "**NOTE**" + $(this).attr("title");
        if (td.prop("className") == "Session") {
            $(this).click(function () {
                var new_window_object = {};
                var url_list = $(this).data("url_list");
                url_list = url_list.replace(/\\"/g, "\"");
                url_list = JSON.parse(url_list);
                new_window_object.url = url_list;
                new_window_object.state = "docked";
                new_window_object.focused = true;
                var title_remove = "$SESSION$" + $(this).attr("title");
                if(page_title == "Link Saver"){
                    change_badge("down");
                    chrome.storage.sync.remove(note_title);
                    chrome.storage.sync.remove(title_remove);
                    $(td).closest('tr').remove();
                }
                chrome.windows.create(new_window_object);
                window.close();
                chrome.windows.update(-2, {focused: false});
            });
        }
        else {
            $(this).click(function () {
                var href = $(this).attr("href");
                if (page_title == "Link Saver") {
                    change_badge("down");
                    chrome.storage.sync.remove(note_title);
                    chrome.storage.sync.remove(href);
                    chrome.tabs.create({'url': href}, function () {
                    });
                }
                else {
                    chrome.windows.remove(-1);
                    chrome.tabs.create({'url': href}, function () {
                    });
                }
            });
        }
    });
}
function change_badge(up_or_down){
    chrome.browserAction.getBadgeText({}, function(number){
        if(up_or_down == "down"){
            number--;
            if(number > 0){
                chrome.browserAction.setBadgeText({text: "" + number});
            }
            else{
                chrome.browserAction.setBadgeText({text: ""});
            }
        }
        else{
            number++;
            chrome.browserAction.setBadgeText({text: "" + number});
        }
    });
}
function show_links(result){
    var page_title = $("title").text();
    var linksTable = document.getElementById('links');
    if(Object.keys(result).length != 0){
        links.push(result);
    }
    var link_string = JSON.stringify(links);
    link_string = link_string.replace(/,/g, "},{");
    var final_all_links = JSON.parse(link_string);
    for(var j in final_all_links){
        var string = JSON.stringify(final_all_links[j]);
        var session_index = string.indexOf("$SESSION$");
        if(session_index != -1){
            var first_colon = string.indexOf(":", session_index);
            var session_key;
            if(string.indexOf("#HISTORY#") != -1){
                session_key = string.slice(session_index-9, first_colon-1);
            }
            else{
                session_key = string.slice(session_index, first_colon-1);
            }
            var retrieved_object = final_all_links[j][session_key];
            retrieved_object = retrieved_object.replace(/\^\^/g, ",");
            retrieved_object = retrieved_object.replace("url", session_key);
            retrieved_object = JSON.parse(retrieved_object);
            final_all_links[j] = retrieved_object;
            continue;
        }
        var new_string = string.replace("$$Date$$", "\", \"date\": \"");
        new_string = new_string.replace("$Icon:", "\", \"icon\":\"");
        new_string = new_string.replace("$Locale$", "\", \"locale\":\"");
        final_all_links[j] = JSON.parse(new_string);
    }
    final_all_links.sort(function(a, b){
        var a_date = Date.parse(a.date);
        var b_date = Date.parse(b.date);
        return a_date - b_date;
    });
    for(var i in final_all_links){
        var url, title, display_url, favIcon_Url, favIcon;
        var date = final_all_links[i].date,
            locale = final_all_links[i]["locale"];
        var object_string = JSON.stringify(final_all_links[i]);
        var index_hist = object_string.indexOf("HISTORY#");
        if(page_title == "Link Saver"){
            if(index_hist != -1){
                continue;
            }
        }
        else{
            if(index_hist == -1){
                continue;
            }
        }
        var note_index = object_string.indexOf("**NOTE**");
        if(note_index != -1){
            continue;
        }
        if(locale != undefined){
            locale = locale.replace("},{", ",");
        }
        else{
            locale = "";
        }
        var index0 = object_string.indexOf(",\"date\"");
        object_string = object_string.slice(0, index0);
        object_string = object_string + "}";
        var session_index_show = object_string.indexOf("$SESSION$");
        var index1 = object_string.indexOf("{\"");
        var index2 = object_string.indexOf("\":\"", 1);
        var index3 = object_string.indexOf("\"}");
        if(session_index_show != -1){
            title = object_string.slice(session_index_show + 9, index2);
            title = title.replace(/},{/g, ",");
            display_url = "Saved Session";
            url = object_string.slice(index2+3, index3);
            var url_tooltip = url.replace(/\\"/g,"\"");
            url_tooltip = JSON.parse(url_tooltip);
            var tooltip_content = "";
            $(url_tooltip).each(function(){
                tooltip_content = tooltip_content + this + ", ";
            });
            tooltip_content = "Links in Session: " + tooltip_content.substring(0, tooltip_content.length -2);
            favIcon_Url = final_all_links[i].icon;
            favIcon = document.createElement('img');
            $(favIcon).attr({title: tooltip_content, src: "img/earth.png", width: '18', height: '18', vAlign: "middle"});
            $(favIcon).hover(function(){
                $(this).prop({src: "img/earth_hover.png"})},
                function(){
                    $(this).prop({src: "img/earth.png"})
                }
            );
        }
        else{
            if(page_title == "Link Saver"){
                url = object_string.slice(index1 + 2, index2);
            }
            else{
                url = object_string.slice(index1 + 11, index2);
            }
            url = url.replace(/},{/g, ",");
            var url_index_www = url.indexOf("www.");
            var url_index_1 = url.indexOf("://");
            var url_index_2 = url.indexOf("/", url_index_1+3);
            if(url_index_www == -1){
                display_url = url.slice(url_index_1+3, url_index_2);
            }
            else{
                display_url = url.slice(url_index_www+4, url_index_2);
            }
            title = object_string.slice(index2 + 3, index3);
            title = title.replace(/},{/g, ",");
            favIcon_Url = final_all_links[i].icon;
            favIcon = document.createElement('img');
            $(favIcon).attr({src: favIcon_Url});
            if($(favIcon).attr("src") == "undefined"){
                $(favIcon).attr({src: "img/placeholder_icon.jpg", width: '18', height: '18'});
            }
            else{}
            if(page_title == "Link Saver"){
                $(favIcon).attr({width: '18', height: '18'});
            }
            else{
                $(favIcon).attr({width: '25', height: '25'});
            }
        }
        var col0 = document.createElement('td');
        var check_box = document.createElement('input');
        check_box.align = "left";
        if(page_title == "Link Saver"){
            $(col0).attr({width: '38'});
            $(check_box).prop({type: 'checkbox', checked: false, className: "check_box"});
            col0.appendChild(check_box);
        }
        else{
            $(col0).attr({width: '45'});
            if(session_index_show != -1){
                $(favIcon).attr({width: '25', height: '25'});
                $(favIcon).prop({class: 'session_center'});
            }
            else{
                $(check_box).prop({type: 'checkbox', checked: false, className: "hist_check_box"});
                col0.appendChild(check_box);
            }
        }
        col0.appendChild(favIcon);
        var a, linkText;
        var col1 = document.createElement('td');
        if(page_title == "Link Saver"){
            col1.width = '250';
        }
        else{
            col1.width = '270';
        }
        linkText = document.createTextNode(title);
        if(session_index_show != -1){
            col1.className = "Session";
            a = document.createElement('a');
            a.appendChild(linkText);
            a.href = "";
            a.class = "session_tooltip";
            a.title = title;
            $(a).data({"url_list": url});
            $(a).prop({class: "hyperlink"});
        }
        else{
            a = document.createElement('a');
            a.appendChild(linkText);
            $(a).attr({title: title, event: false, href: url});
            $(a).prop({class: "hyperlink"});
        }
        col1.appendChild(a);
        var col2 = document.createElement('td');
        if(page_title == "Link Saver"){
            col2.width = '155';
        }
        else{
            col2.width = '130';
        }
        col2.innerText = display_url;
        var col3 = document.createElement('td');
        col3.valign = "middle";
        if(page_title == "Link Saver"){
            var delete_img = document.createElement('input');
            $(delete_img).attr({width: '15', height: '15', align: "right", title: "Delete Link", style: "vertical-align:middle"});
            $(delete_img).prop({type: "image", src: "img/delete_icon.png", className: "delete_link"});
            $(delete_img).hover(function(){
                $(this).prop({src: "img/delete_icon_hover.png"})},
                function(){
                    $(this).prop({src: "img/delete_icon.png"})
                });
            col3.appendChild(delete_img);
        }
        else{
            col3.innerText = locale;
            col3.width = '140';
        }
        var tr = linksTable.insertRow(0);
        tr.appendChild(col0);
        tr.appendChild(col1);
        tr.appendChild(col2);
        tr.appendChild(col3);
    }
    var tr_length = $(linksTable).find("tr").length;
    if(tr_length == 0){
        var caption = document.createElement("caption");
        caption.innerText = "No links/sessions are currently saved.";
        linksTable.appendChild(caption);
    }
    var hyperlinks = document.getElementsByClassName("hyperlink");
    add_hyperlinks(hyperlinks);
    delete_links();
}
function delete_links(){
    var Delete_Selected_Button = document.getElementsByClassName("delete_link");
    for(var i=0; i < Delete_Selected_Button.length; i++){
        Delete_Selected_Button[i].addEventListener("click", function(){
            _gaq.push(['_trackEvent', 'delete_button', 'clicked']);
            var row = $(this).closest("tr"),
                a = row.find("a"),
                td = $(a).closest("td");
            if($(td).prop("className") == "Session"){
                var key_remove = "$SESSION$" + $(a).attr("title");
                chrome.storage.sync.remove(key_remove);
            }
            else{
                console.log($(a).attr('href'));
                chrome.storage.sync.remove("**NOTE**" + $(a).attr("title"));
                chrome.storage.sync.remove($(a).attr('href'));
            }
            row.remove();
            var linksTable = document.getElementById('links');
            var tr_length = $(linksTable).find("tr").length;
            if(tr_length == 0){
                var caption = document.createElement("caption");
                caption.innerText = "No links/sessions are currently saved.";
                linksTable.appendChild(caption);
            }
            change_badge("down");
        });
    }
}
function display_notes(){
    $("a").each(function(){
        var note_key = "**NOTE**" + $(this).attr("title");
        chrome.storage.sync.get(note_key, function(result){
            if(result[note_key] != undefined){
                note_key = note_key.slice(8);
                $("a").each(function(){
                    if($(this).attr("title") == note_key){
                        var td_note = $(this).closest("td").next();
                        var unhover_text = td_note.text();
                        $(this).hover(function(){
                            $(td_note).html(result["**NOTE**" + note_key]);},
                            function(){
                                $(td_note).html(unhover_text);
                            }
                        );
                    }
                });
            }
        });
    });
}
function add_notes(){
    var Add_Note_Button = document.getElementById("add_note");
    Add_Note_Button.addEventListener("click", function(){
         var has_checked = false;
         $('tr').each(function(){
             if($(this).find("input.check_box").prop('checked')){
                 has_checked = true;
             }
         });
         if(has_checked == true){
             var note_text = prompt("Enter the note you would like to save for the selected link(s).", "Type Here");
             if(note_text != null){
                 $("tr").each(function(){
                     if($(this).find("input.check_box").prop('checked')){
                         var a_tag = $(this).find("a");
                         var a_title = "**NOTE**" + a_tag.attr("title");
                         var note_object = {};
                         note_object[a_title] = note_text;
                         chrome.storage.sync.set(note_object);
                         $(this).find("input.check_box").prop('checked', false);
                     }
                 });
                 display_notes();
                 var all_check = document.getElementById("check_all");
                 if(all_check.checked = true){
                     all_check.checked = false;
                 }
             }
         }
    });
}
function open_links(){
    var Open_Selected_Button = document.getElementById("open_selected");
    Open_Selected_Button.addEventListener("click", function(){
        var open_list = document.getElementsByTagName('tr');
        var counter = 0;
        $("tr").each(function(){
            if($(this).find("input.check_box").prop('checked')){
                var a_open = $(this).find("a");
                if($(a_open).closest("td").prop("className") == "Session"){
                    var new_window_object = {};
                    var url_list = $(a_open).data("url_list");
                    url_list = url_list.replace(/\\"/g,"\"");
                    url_list = JSON.parse(url_list);
                    new_window_object.url = url_list;
                    new_window_object.focused = true;
                    chrome.storage.sync.remove("**NOTE**" + $(a_open).attr("title"));
                    var title_remove = "$SESSION$" + $(a_open).attr("title");
                    $(a_open).closest('tr').remove();
                    chrome.storage.sync.remove(title_remove);
                    chrome.windows.create(new_window_object);
                }
                else{
                    var redirect_url = $(this).find("a").attr('href');
                    chrome.storage.sync.remove(redirect_url);
                    chrome.tabs.create({'url': redirect_url}, function(){});
                }
            }
            else{
                counter++;
            }
            if(counter == 0){
                counter = "";
            }
            else{
                counter = "" + counter;
            }
            chrome.browserAction.setBadgeText({text: counter});
        });
    });
}
function save_session(){
    var save_session_button = document.getElementById("save_session");
    save_session_button.addEventListener("click", function(){
        chrome.windows.getCurrent({populate: true},function(window){
            var urls = [],
                tabs = window.tabs;
            for(var i=0; i<tabs.length; i++){
                var url = tabs[i].url;
                urls.push(url);
            }
            var url_object = {},
                session_date = new Date(),
                key = prompt("Enter name of session:");
            if(key == null){
                return;
            }
            url_object.url = JSON.stringify(urls);
            url_object.date = session_date.toString();
            url_object.locale =session_date.toLocaleString();
            key = "$SESSION$" + key;
            var session_object = {},
                history_session_object = {},
                history_key = "#HISTORY#" + key,
                with_commas = JSON.stringify(url_object);
            session_object[key] = with_commas.replace(/,/g, "^^");
            history_session_object[history_key] = with_commas.replace(/,/g, "^^");
            chrome.storage.local.set(history_session_object);
            chrome.storage.sync.set(session_object);
            change_badge("up");
            chrome.storage.sync.get(key, function(result){
                links = [];
                $('caption').remove();
                show_links(result);
            });
        });
    });
}
function check_all(){
    _gaq.push(['_trackEvent', 'check_all', 'clicked']);
    var check = document.getElementById("check_all").checked;
    $("input.check_box").each(function(){
        $(this).prop({checked: check});
    });
}
function button_analytics(){
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', trackButton);
    }
}

function main_extension(){
    button_analytics();
    document.getElementById('check_all').onchange = check_all;
    chrome.storage.sync.get(null, function(result){
        show_links(result);
        save_link();
        history_window();
        open_links();
        add_notes();
        display_notes();
        save_session();
    });
}
function history_window(){
    var History_button = document.getElementById("History");
    History_button.addEventListener("click", function(){
        chrome.windows.create({'url': 'history_popup.html', 'type': 'normal'}, function(window) {
        });
    });
}
function history(){
    button_analytics();
    chrome.storage.local.get(null, function(result){
        show_links(result);
        clear_history();
        bookmark();
    });
}
function clear_history(){
    var clear_history_button = document.getElementById("clear_history");
    clear_history_button.addEventListener("click", function(){
        var r_confirm = confirm("Are you sure you want to clear your history? Your current unread links/sessions will remain saved.");
        if(r_confirm == true){
            _gaq.push(['_trackEvent', 'clear_history_true', 'clicked']);
            chrome.storage.local.clear();
            $('tr').each(function(){
                $(this).remove();
            });
            var caption = document.createElement("caption");
            caption.innerText = "No links/sessions are currently saved.";
            $('table').appendChild(caption);
        }
    });
}
function bookmark(){
    var save_bookmarks_button = document.getElementById("save_bookmarks");
    save_bookmarks_button.addEventListener("click", function(){
        var counter = 0,
            bookmark = " bookmark";
        $('tr').each(function(){
            if($(this).find("input.hist_check_box").prop('checked')){
                var a_element = $(this).find("a");
                var bookmark_object = {};
                bookmark_object.title = $(a_element).attr("title");
                bookmark_object.url = $(a_element).attr("href");
                counter++;
                chrome.bookmarks.create(bookmark_object, function(){});
                $(this).find("input.hist_check_box").prop('checked', false);
            }
            else{}
        });
        if(counter == 0){
            return;
        }
        else if(counter > 1){
            bookmark = " bookmarks";
        }
        alert(counter + bookmark + " created!");
    });
}
document.addEventListener("DOMContentLoaded", function(){
    var status = document.title;
    if(status.valueOf() === "History"){
        history();
    }
    else{
        main_extension();
    }
});
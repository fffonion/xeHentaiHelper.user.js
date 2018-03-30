// ==UserScript==
// @name        xeHentai Helper
// @version     0.07
// @description Become a hentai
// @namespace 	https://yooooo.us
// @updateURL 	https://dl.yooooo.us/userscripts/xeHentaiHelper.user.js
// @downloadURL https://dl.yooooo.us/userscripts/xeHentaiHelper.user.js
// @include     http*://*e-hentai.org/
// @include     http*://*e-hentai.org/#
// @include     http*://*e-hentai.org/?*
// @include     http*://*e-hentai.org/g/*
// @include     http*://*e-hentai.org/tag/*
// @include     http*://exhentai.org/
// @include     http*://exhentai.org/#
// @include     http*://exhentai.org/?*
// @include     http*://exhentai.org/g/*
// @include     http*://exhentai.org/tag/*
// @license     GNU General Public License (GPL)
// @run-at      document-end
// @grant none
// ==/UserScript==

// ==== ARIA2 class taken from Binux's ThunderLixianExported === //

(function (){
    var xeh_endpoints = {
        "default":"http://127.0.0.1:8010/jsonrpc",
    };

    var JSONRPC = (function() {
        var jsonrpc_version = '2.0';

        function get_auth(url) {
            return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
        };

        function request(jsonrpc_path, method, params) {
            var xhr = new XMLHttpRequest();
            var auth = get_auth(jsonrpc_path);
            jsonrpc_path = jsonrpc_path.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3'); // auth string not allowed in url for firefox

            var request_obj = {
                jsonrpc: jsonrpc_version,
                method: method,
                id: (new Date()).getTime().toString(),
            };
            if (params) request_obj.params = params;
            if (auth && auth.indexOf('token:') == 0) params.unshift(auth);

            xhr.open("POST", jsonrpc_path+"?tm="+(new Date()).getTime().toString(), true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            if (auth && auth.indexOf('token:') != 0) {
                xhr.setRequestHeader("Authorization", "Basic "+btoa(auth));
            }
            xhr.send(JSON.stringify(request_obj));
        };

        return function(jsonrpc_path) {
            this.jsonrpc_path = jsonrpc_path;
            this.addTask = function (uri, options) {
                request(this.jsonrpc_path, 'xeH.addTask', [[uri, ], options]);
            };
            this.setCookie = function (cookie) {
                request(this.jsonrpc_path, 'xeH.setCookie', [[cookie, ], {}]);
            };
            return this;
        };
    })();
    XEH = {};
    (function(XEH){
        var jr = JSONRPC(xeh_endpoints['default']);
        var gd5 = document.getElementById("gd5");
        if(gd5){ // gallery page
            var p = document.createElement("p");
            p.innerHTML = '<img src="http://ehgt.org/g/mr.gif"> <a id="xeh_addtask" href="#">添加到xeHentai</a>';
            p.className = "g2";
            p.onclick = function(){
                if (document.cookie.indexOf("ipb_pass_hash") != -1 && document.cookie.indexOf("ipb_member_id") != -1){
                    jr.setCookie(document.cookie);
                }
                jr.addTask(location.protocol+'//'+location.host+location.pathname, {});
            };
            gd5.appendChild(p);
        }
        var it3s = document.getElementsByClassName("it3");
        if(it3s && it3s.length){ // index page
            var it5s = document.getElementsByClassName("it5");
            var allinps = [];
            for (var i = 0; i < it3s.length; ++i) {
                var ip = document.createElement("input");
                ip.type = "checkbox";
                ip.style= "float:left";
                ip.value = decodeURIComponent(it5s[i].childNodes[0].href);
                it3s[i].parentNode.insertBefore(ip, it3s[i]);
                allinps.push(ip);
            }
            var titlebar = document.getElementsByClassName("itg")[0].childNodes[1].childNodes[0];
            titlebar.childNodes[2].innerHTML = '<input type="checkbox" id="xeh_toogle">反选</input>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                '<a href="#" id="xeh_export">导出选中项到xeHentai</a>';
            document.getElementById("xeh_toogle").onclick=function(s){
                for (var i = 0; i < allinps.length; ++i) {
                    allinps[i].checked = !allinps[i].checked;
                }
            };
            document.getElementById("xeh_export").onclick=function(s){
                if (document.cookie.indexOf("ipb_pass_hash") != -1 && document.cookie.indexOf("ipb_member_id") != -1){
                    jr.setCookie(document.cookie);
                }
                for (var i = 0; i < allinps.length; ++i) {
                    if(allinps[i].checked){
                        jr.addTask(allinps[i].value, {});
                    }
                }
            };
        }
    })(XEH);
})();







// ==UserScript==
// @name        xeHentai Helper
// @version     0.23
// @description Become a hentai
// @namespace 	https://yooooo.us
// @updateURL 	https://dl.yooooo.us/userscripts/xeHentaiHelper.user.js
// @downloadURL https://dl.yooooo.us/userscripts/xeHentaiHelper.user.js
// @include     http*://*e-hentai.org/*
// @include     http*://exhentai.org/*
// @license     GNU General Public License (GPL)
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_xmlHttpRequest
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.xmlHttpRequest
// ==/UserScript==

// ==== ARIA2 class taken from Binux's ThunderLixianExported === //
(function () {
    var JSONRPC = (function () {
        var jsonrpc_version = '2.0';

        function get_auth(url) {
            return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
        };

        function request(jsonrpc_path, method, params) {
            var auth = get_auth(jsonrpc_path);
            jsonrpc_path = jsonrpc_path.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3'); // auth string not allowed in url for firefox

            var request_obj = {
                jsonrpc: jsonrpc_version,
                method: method,
                id: (new Date()).getTime().toString(),
            };
            if (params) request_obj.params = params;
            if (auth && auth.indexOf('token:') == 0) params.unshift(auth);

            var headers = {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            }
            if (auth && auth.indexOf('token:') != 0) {
                headers["Authorization"] = "Basic " + btoa(auth);
            }
            GM_xmlHttpRequest({
                method: "POST",
                url: jsonrpc_path + "?tm=" + (new Date()).getTime().toString(),
                headers: headers,
                data: JSON.stringify(request_obj),
                onerror: function(e) { console.error(method, params[0], params[1], "=>", e) },
                onload: function(r) { console.info(method, params[0], params[1], "=>", JSON.parse(r.responseText)) },
            })
        };

        return function (jsonrpc_path) {
            this.jsonrpc_path = jsonrpc_path;
            this.addTask = function (uri, options) {
                request(this.jsonrpc_path, 'xeH.addTask', [
                    [uri, ], options
                ]);
            };
            this.setCookie = function (cookie) {
                request(this.jsonrpc_path, 'xeH.setCookie', [
                    [cookie, ], {}
                ]);
            };
            return this;
        };
    })();

    // dom helper functions
    function newWrapperDiv(label, dom) {
        var grp = document.createElement("div");
        grp.innerHTML = label + "：";
        grp.appendChild(dom);
        return grp;
    }

    function newInput() {
        var input = document.createElement("input");
        input.type = "text";
        input.size = 50;
        input.style = "margin-bottom: 5px"
        return input;
    }

    function newButton(label, style, f) {
        var btn = document.createElement("div");
        btn.innerHTML = "<a href='javascript:void(0)'>" + label + "</a>";
        btn.style = "position: absolute; " + (style || "");
        btn.onclick = f;
        btn.className = "gt";
        return btn;
    }

    if (GM !== undefined) {
        this.GM_getValue = GM.getValue;
        this.GM_setValue = GM.setValue;
        this.GM_deleteValue = GM.deleteValue;
        this.GM_xmlHttpRequest = GM.xmlHttpRequest;
    }
    if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported") > -1)) {
        console.info("[XEH] using fallback set/getValue")
        this.GM_getValue = function (key, def) {
            return localStorage[key] || def;
        };
        this.GM_setValue = function (key, value) {
            return localStorage[key] = value;
        };
        this.GM_deleteValue = function (key) {
            return delete localStorage[key];
        };
    }
    if (!this.GM_xmlHttpRequest) {
        console.info("[XEH] using fallback XHR")
        this.GM_xmlHttpRequest = function(opts) {
            var xhr = new XMLHttpRequest();
            xhr.open(opts.method, opts.url, !opts.synchronous);
            for(let key in opts.headers || {}) {
                xhr.setRequestHeader(key, opts.headers[key]);
            }
            xhr.onerror = opts.onerror;
            xhr.onload = function() {
                if (xhr.readyState === xhr.DONE) {
                    opts.onload(xhr);
                }
            }
            xhr.send(opts.data);
        }
    }

    XEH = {
        config_keys: ["host", "port", "token", "name"],
    };
    (function (XEH) {
        // JSONRPC client, will be initlized in the config area
        var jr;
        var gd5 = document.getElementById("gd5");
        if (gd5) { // gallery page
            var p = document.createElement("p");
            p.innerHTML = '<img src="https://ehgt.org/g/mr.gif"> <a id="xeh_addtask" href="#">添加到xeHentai</a>';
            p.className = "g2";
            p.onclick = function () {
                if (document.cookie.indexOf("ipb_pass_hash") != -1 && document.cookie.indexOf("ipb_member_id") != -1) {
                    jr.setCookie(document.cookie);
                }
                jr.addTask(location.protocol + '//' + location.host + location.pathname, {});
            };
            gd5.childNodes[gd5.childNodes.length - 1].className = "g2";
            gd5.appendChild(p);
        }
        var glnames = document.getElementsByClassName("glname");
        if (glnames && glnames.length) { // index page
            function saveInputState() {
                var checked = {};
                for (var i = 0; i < allinps.length; ++i) {
                    if (allinps[i].checked) {
                        checked[allinps[i].value] = 1;
                    }
                }
                GM_setValue("xeh_checked", JSON.stringify(checked));
            }

            function loadInputState() {
                var checked = JSON.parse(GM_getValue("xeh_checked", "0"));
                if (!checked) return;
                for (var i = 0; i < allinps.length; ++i) {
                    if (checked[allinps[i].value] === 1) {
                        allinps[i].checked = true;
                    }
                }
            }
            var inp_onclick = function (e) {
                e.stopPropagation();
                saveInputState();
            };
            var allinps = [];
            for (var i = 0; i < glnames.length; ++i) {
                var glname = glnames[i];
                var ip = document.createElement("input");
                ip.type = "checkbox";
                ip.style = "float:left;font-size:20px;top:0;";
                var href;
                var href_dom = glname;
                for (var j = 0; j < 3; j++) {
                    href = href_dom.innerHTML.match(/\/g\/\d+\/[a-f0-9]+\//);
                    if (href) break;
                    href_dom = href_dom.parentNode;
                }
                ip.value = decodeURIComponent(location.protocol + "//" + location.hostname + href[0]);
                ip.onclick = inp_onclick;
                var doms = href_dom.childNodes;
                for (var j = 0; j < doms.length; j++) {
                    if (doms[j].tagName === "A") {
                        doms[j].insertBefore(ip, doms[j].childNodes[0]);
                    }
                }
                allinps.push(ip);
            }
            var titlebar = document.getElementsByClassName("itg")[0].childNodes[0].childNodes[0];
            var titleInnerHTML = '<input type="checkbox" id="xeh_toogle" style="margin-left:9px;top:0;">反选</input>' +
                '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a id="xeh_clear" href="javascript:void(0)">清空</a>' +
                '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a id="xeh_export" href="javascript:void(0)">导出选中项到xeHentai</a>';
            if (glnames[0].className.search(/gl\d[te]/) != -1) { // extended or thumbail mode
                var td = document.createElement("td");
                td.innerHTML = titleInnerHTML;
                td.style = "width: auto;position: absolute;left: 10px;font-size: 12px;";
                var tr = document.getElementsByClassName("ptt")[0].childNodes[0].childNodes[0]
                tr.insertBefore(td, tr.childNodes[0]);
            } else {
                for (var j = 0; j < titlebar.childNodes.length; j++) {
                    if (titlebar.childNodes[j].innerHTML.search(/title/i) !== -1) {
                        titlebar.childNodes[j].innerHTML = titleInnerHTML;
                    }
                }
            }

            loadInputState();

            document.getElementById("xeh_toogle").onclick = function (s) {
                for (var i = 0; i < allinps.length; ++i) {
                    allinps[i].checked = !allinps[i].checked;
                }
                saveInputState();
            };
            document.getElementById("xeh_clear").onclick = function (s) {
                for (var i = 0; i < allinps.length; ++i) {
                    allinps[i].checked = false;
                }
                saveInputState();
            };
            document.getElementById("xeh_export").onclick = function (s) {
                if (document.cookie.indexOf("ipb_pass_hash") != -1 && document.cookie.indexOf("ipb_member_id") != -1) {
                    jr.setCookie(document.cookie);
                }
                for (var i = 0; i < allinps.length; ++i) {
                    if (allinps[i].checked) {
                        jr.addTask(allinps[i].value, {});
                    }
                }
            };
        }

        // config
        var titleBar = document.getElementById("nb");
        if (titleBar) {
            // increase width for exhentai
            if (titleBar.childElementCount < 10) {
                titleBar.style.maxWidth = "750px";
            }
            var div = document.createElement("div");
            div.innerHTML = '<div><a>xeHentai</a></div>';
            div.onclick = function () {
                configBox.style.display = "block";
            };
            titleBar.appendChild(div);

            // the config box
            var configBox = document.createElement("div");
            configBox.className = "gm"
            configBox.innerHTML = '<h1 id="gn" style="text-align: center;">xeHentai 配置</h1>';
            configBox.style = "height: 300px; position: absolute; top: 200px; z-index: 999; left: 50%; margin-left: -250px; min-width: 320px;";
            configBox.style.display = "none";
            document.body.appendChild(configBox)

            /****************** starts top buttons ************************/
            var closeBtn = newButton("关闭", "right: 5px; top: 5px;", function () {
                configBox.style.display = "none";
            });
            configBox.appendChild(closeBtn);
            /****************** ends top buttons ************************/

            /****************** starts input areas ************************/
            var controlsGrp = document.createElement("div");
            controlsGrp.style = "padding: 10px;"

            XEH.configs = undefined;
            var inputs = {};

            function saveConfigSet(who) {
                GM_setValue("xeh_configs", JSON.stringify(XEH.configs));
                GM_setValue("xeh_config_idx", who.selectedIndex);
            }

            function loadConfigSet(i) {
                if (XEH.configs === undefined) {
                    XEH.configs = JSON.parse(GM_getValue("xeh_configs", "{}"));
                }
                if (XEH.configs.length === 0) {
                    XEH.configs = [{
                        "host": "localhost",
                        "port": 8010,
                        "name": "<默认>"
                    }];
                }
                if (i === undefined) {
                    i = parseInt(GM_getValue("xeh_config_idx", "0"));
                }
                if (i >= XEH.configs.length) {
                    i = 0
                }

                var cfg = XEH.configs[i];
                for (var j = 0; j < XEH.config_keys.length; j++) {
                    var k = XEH.config_keys[j];
                    inputs[k].value = cfg[k] || "";
                }

                return i;
            }

            function initJSONRPC(i) {
                var cfg = XEH.configs[i]
                jr = JSONRPC("http://" + (cfg.token ? ("token:" + cfg.token + "@") : "") +
                    cfg.host + ":" + cfg.port + "/jsonrpc");
            }

            var hasNewConfigUnsaved = false;

            // add <select> first, its options will be filled later
            var configSet = document.createElement("select");
            var configSetOnChangeHandler = function () {
                if (hasNewConfigUnsaved) {
                    this.remove(this.length - 1)
                    hasNewConfigUnsaved = false;
                }
                var i = this.selectedIndex
                loadConfigSet(i)
                initJSONRPC(i)
            }
            configSet.onchange = configSetOnChangeHandler;
            controlsGrp.appendChild(newWrapperDiv("当前配置", configSet));

            configBox.appendChild(controlsGrp);

            var __input_labels = ["地址", "端口", "密钥", "名称"];
            for (var i = 0; i < XEH.config_keys.length; i++) {
                var k = XEH.config_keys[i];
                inputs[k] = newInput();
                controlsGrp.appendChild(newWrapperDiv(__input_labels[i], inputs[k]));
            }
            inputs.port.size = 6;

            // load input boxes etc.
            var shouldSelectedIdx = loadConfigSet();

            for (var i = 0; i < XEH.configs.length; i++) {
                var c = document.createElement("option");
                c.text = XEH.configs[i].name;
                configSet.options.add(c)
            }
            configSet.selectedIndex = shouldSelectedIdx;
            initJSONRPC(shouldSelectedIdx)
            /****************** ends input areas ************************/

            /****************** starts bottom buttons ************************/
            var addBtn = newButton("新建", "left: 20px; bottom: 5px;", function () {
                for (var i = 0; i < XEH.config_keys.length; i++) {
                    var k = XEH.config_keys[i];
                    inputs[k].value = "";
                }
                var c = document.createElement("option");
                c.text = "<新配置>";
                configSet.options.add(c);
                configSet.selectedIndex = configSet.options.length - 1;
                hasNewConfigUnsaved = true;
            });
            configBox.appendChild(addBtn);

            var delBtn = newButton("删除", "left: 70px; bottom: 5px;", function () {
                var i = configSet.selectedIndex;
                configSet.remove(i);
                configSet.selectedIndex = Math.max(i-1, 0);
                hasNewConfigUnsaved = false;
                XEH.configs.splice(i);
                saveConfigSet(configSet);
            });
            configBox.appendChild(delBtn);

            var ojbkBtn = newButton("保存", "left: 150px; bottom: 5px;", function (e) {
                var idx = configSet.selectedIndex;
                var cfg;
                if (inputs.host.value == "" || parseInt(inputs.port.value) === undefined) {
                    alert("地址不能为空，端口必须为数字");
                    e.stopImmediatePropagation();
                    return;
                }
                if (hasNewConfigUnsaved) {
                    hasNewConfigUnsaved = false
                    cfg = {}
                    XEH.configs.push(cfg)
                } else {
                    cfg = XEH.configs[idx]
                }
                inputs.name.value = inputs.name.value || (inputs.host.value + ":" + inputs.port.value);
                for (var i = 0; i < XEH.config_keys.length; i++) {
                    var k = XEH.config_keys[i];
                    cfg[k] = inputs[k].value;
                }
                configSet.options.item(idx).text = cfg.name;
                saveConfigSet(configSet);
                initJSONRPC(idx);
            });
            configBox.appendChild(ojbkBtn);

            var resetBtn = newButton("重置", "right: 5px; bottom: 5px;", function () {
                loadConfigSet(configSet.selectedIndex)
            });
            configBox.appendChild(resetBtn);
            /****************** ends bottom buttons ************************/

            /****************** starts duplicate ui ************************/
            var closeBtn2 = closeBtn.cloneNode(true);
            closeBtn2.style = "position: absolute; left: 200px; bottom: 5px;";
            closeBtn2.onclick = closeBtn.onclick;
            configBox.appendChild(closeBtn2);

            var xehExportAnchor = document.getElementById("xeh_export");
            if (xehExportAnchor) {
                var configSet2 = configSet.cloneNode(true);
                configSet2.style = configSet2.style + "; margin-left: 10px;"
                configSet2.addEventListener("change", function () {
                    configSet.selectedIndex = this.selectedIndex;
                    saveConfigSet(this);
                });
                configSet2.addEventListener("change", configSetOnChangeHandler);

                configSet.addEventListener("change", function () {
                    configSet2.selectedIndex = this.selectedIndex;
                })

                delBtn.addEventListener("click", function () {
                    var i = configSet2.selectedIndex;
                    configSet2.remove(i);
                    configSet2.selectedIndex = Math.max(i-1, 0);
                });
                ojbkBtn.addEventListener("click", function () {
                    var i = configSet.selectedIndex;
                    var c = document.createElement("option");
                    c.text = XEH.configs[i].name;
                    configSet2.options.add(c);
                    configSet2.selectedIndex = i;
                });
                xehExportAnchor.parentNode.appendChild(configSet2);
                configSet2.selectedIndex = shouldSelectedIdx;
            }
            /****************** ends duplicate ui ************************/
        }
    })(XEH);
})();

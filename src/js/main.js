(() => {
    let org; // 原始文章文本
    let config; // 配置对象
    let dataPool = {}; // 获取的原始数据
    let editData = {}; // 获取的原始数据
    // 从 URL 获取 CaseID 和 ProjectID 参数
    const MYURL = new URL(window.location.href)
    const CaseID = MYURL.searchParams.get('CaseID');
    const ProjectID = MYURL.searchParams.get('ProjectID');
    const Editor = MYURL.searchParams.get('Editor');

    const replaceWhitwSpace = "_"; // 用于替换空白字符

    // 清空指定容器内的所有子元素
    const cleanContainer = (target) => {
        const container = document.querySelector(target);
        while (container.firstChild) {
            container.removeChild(container.lastChild);
        }
    }

    // 加载配置文件
    const loadConfig = () => {
        return new Promise((resolve, reject) => {
            fetch("./js/config.json", {
                method: 'GET',
            }).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.log("配置文件加载失败");
                    return null;
                }
            }).then(result => {
                resolve(result);
            }).catch(error => {
                console.error(error);
            })
        })
    }

    // 通过 API 请求加载数据
    const contentLoader = (path, params) => {
        return new Promise((resolve, reject) => {
            fetch(path, {
                //method: 'POST',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // 如果需要其他头信息，可以在这里添加
                },
                //body: JSON.stringify(params)
            }).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.log("连接失败");
                    reject(response);
                }
            }).then(result => {
                resolve(result);
            }).catch(error => {
                console.error(error);
                reject(error);
            })
        })
    }

    // 正確與錯誤的總數量
    const renderTotalRW = () => {
        let right = 0;
        let wrong = 0;
        for (let key in dataPool) {
            dataPool[key].map(item => {
                item.check == 1 && right++
                item.check == 0 && wrong++
            })
        }
        document.querySelector(".nav  span.right").innerHTML = right
        document.querySelector(".nav  span.wrong").innerHTML = wrong
    }

    //檢查補充資料是否可以送出
    const checkAboutPanel = ()=>{
        console.log(editData)
        if(editData.span_txt !=null &&  editData.code !=null &&  editData.code_name !=null &&  editData.source !=null ){
            document.querySelector(".modal.aboutPanel .footer button").classList.remove("disabled")
        }else{
            document.querySelector(".modal.aboutPanel .footer button").classList.add("disabled")
        }
    }

    //設定自動完成欄位
    const autocomplete = (inp, arr, action) => {
        let currentFocus;
        inp.addEventListener("input", function (e) {
            let a, b, i, val = this.value;
            closeAllLists();
            if (!val) { return false; }
            currentFocus = -1;
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            this.parentNode.appendChild(a);

            for (let i = 0; i < arr.length; i++) {
                const keyword = arr[i].code_name
                if (keyword.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    b = document.createElement("DIV");
                    b.innerHTML = "<strong>" + keyword.substr(0, val.length) + "</strong>";
                    b.innerHTML += keyword.substr(val.length);
                    b.innerHTML += "<input type='hidden' value='" + keyword + "'>";
                    const _d = arr[i]
                    b.addEventListener("click", function (e) {
                        inp.value = this.getElementsByTagName("input")[0].value;
                        checkAboutPanel()
                        action(_d)
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });

        inp.addEventListener("keydown", e => {
            let x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) {

                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) {
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
            }
        });
        const addActive = x => {
            if (!x) return false;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add("autocomplete-active");
        }
        const removeActive = x => {
            for (let i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        const closeAllLists = elmnt => {
            let x = document.getElementsByClassName("autocomplete-items");
            for (let i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        document.addEventListener("click", e => {
            closeAllLists(e.target);
        });
    }

    //自動完成點選後的資料處理
    const afterAutocomplete = data =>{
        editData = {...editData, ...data}
        document.querySelector(".modal.aboutPanel .code").innerHTML = data.code
        const badge = document.querySelector(".modal.aboutPanel .badge")
        badge.innerHTML = data.source
        badge.classList.add(data.source)
        document.querySelector(".modal.aboutPanel .badge").innerHTML = data.source
        checkAboutPanel()
    }

    // 设置右侧功能栏
    const renderCodePanel = response => {
        // 清空之前的 dataPool
        dataPool = {};
        let spantxtBox = []
        // 遍历段落，收集数据
        response.paragraphs.forEach(paragraph => {
            let paragraphType = paragraph.type;
            paragraph.code_list.forEach(item => {
                // 初始化 dataPool 中的 source，如果还未初始化
                if (!dataPool[item.source]) {
                    dataPool[item.source] = [];
                }

                // 将项添加到 dataPool 中
                dataPool[item.source].push({
                    eye: 0,
                    source: item.source,
                    code: item.code,
                    code_name: item.code_name,
                    span_txt: item.span_txt,
                    confidence: item.confidence,
                    edit: item.edit,
                    check: item.check, // 0未处理, -1错误, 1正确
                    insurance_related: item.insurance_related
                });

                spantxtBox.push({
                    span_txt: item.span_txt,
                    code: item.code,
                    source: item.source,
                })
            });
        });

        const findObj = (source, code, action) => {
            dataPool[source].forEach(d => {
                if (d.code == code) {
                    action(d)
                }
            });
        }

        // 渲染标签和行
        const renderRow = (data) => {
            const box = document.querySelector("#codeRow");
            cleanContainer("#codeRow");

            //編輯按鈕
            const createFixBtn = (row) => {
                const btn = document.createElement("img");
                btn.src = "./img/fix.svg";
                btn.classList.add("toFix")
                btn.addEventListener("click", () => {
                    const panel = document.querySelector(".aboutPanel")
                    const badge = panel.querySelector(".badge")
                    badge.classList.remove(...badge.classList)
                    badge.classList.add("badge", row.source)
                    panel.classList.remove("close")
                    panel.querySelector(".badge").innerHTML = row.source
                    panel.querySelector(".code").innerHTML = row.code
                    panel.querySelector(".codeName").value = row.code_name
                    panel.querySelector(".openkeyWordPanel").innerHTML = row.span_txt
                    editData = {...editData, ...row}
                    checkAboutPanel()
                    //panel.querySelector(".confidence").innerHTML = row.confidence
                    //console.log(row)
                })
                return btn
            }

            data.map((item, sn) => {
                const tr = document.createElement("tr");
                tr.style.animationDelay = `${sn * 100}ms`;
                // 第一列
                const td = document.createElement("td");
                const eye = document.createElement("i");
                eye.classList.add("eye", item["source"])
                eye.dataset.code = item['code'];
                item.eye == 0 ? eye.classList.add("fa-regular", "fa-eye-slash") : eye.classList.add("fa-regular", "fa-eye");
                eye.addEventListener("click", event => {
                    findObj(item["source"], event.target.dataset.code, res => {
                        if (res.eye == 0) {
                            res.eye = 1;
                            eye.classList.remove("fa-eye-slash")
                            eye.classList.add("fa-eye")
                            document.querySelectorAll(`#myArtical .content .mark.code${event.target.dataset.code}`).forEach(mark => {
                                mark.classList.remove("close")
                            })
                        } else {
                            res.eye = 0;
                            eye.classList.remove("fa-eye")
                            eye.classList.add("fa-eye-slash")
                            document.querySelectorAll(`#myArtical .content .mark.code${event.target.dataset.code}`).forEach(mark => {
                                mark.classList.add("close")
                            })
                        }
                    })
                });
                td.appendChild(eye);
                tr.appendChild(td);
                // 其他列
                for (let key in item) {
                    const td = document.createElement("td");
                    td.classList.add(key);
                    switch (key) {
                        case "span_txt":
                            const box = document.createElement("div");
                            box.classList.add("spanTxtBox")
                            findBtns(item[key]).map((val, index) => {
                                const btn = document.createElement("button");
                                btn.dataset.code = item['code'];
                                btn.innerHTML = item[key]
                                btn.classList.add(item["source"])
                                btn.addEventListener("click", event => {
                                    doSearch(item[key], item["source"], index)
                                    findObj(item["source"], event.target.dataset.code, (d) => {
                                        d.eye = 1;
                                        eye.classList.remove("fa-eye-slash")
                                        eye.classList.add("fa-eye")
                                    })
                                })
                                box.appendChild(btn)
                            })
                            td.appendChild(box)
                            tr.appendChild(td);
                            break
                        case "code_name":
                            td.innerHTML = item[key];
                            tr.appendChild(td);
                            break;
                        case "confidence":
                            td.innerHTML = item[key];
                            tr.appendChild(td);
                            break;
                        case "source":
                            const badge = document.createElement("div");
                            badge.classList.add("badge", item["source"]);
                            badge.innerHTML = item[key].replace(replaceWhitwSpace, " ");
                            td.appendChild(badge);
                            tr.appendChild(td);
                            break;
                        case "code":
                            td.classList.add(item["source"]);
                            td.innerHTML = item[key];
                            tr.appendChild(td);
                            break;
                        case "edit":
                            if (Editor == 1) {
                                if (item['edit'] == 1) td.appendChild(createFixBtn(item));
                                tr.appendChild(td);
                            }
                            break
                        case "check":
                            const changeBtnState = (_v, _val) => {
                                if (_val == 1) {
                                    _v.src = "./img/checkv1.svg";
                                } else {
                                    _v.src = "./img/checkv0.svg";
                                }
                            }
                            const btnV = document.createElement("img");
                            btnV.classList.add("check")
                            btnV.dataset.code = item['code'];
                            btnV.addEventListener("click", event => {
                                findObj(item["source"], event.target.dataset.code, (d) => {
                                    d.check == 0 || d.check == -1 ?
                                        d.check = 1 :
                                        d.check = 0;
                                    changeBtnState(btnV, d.check)
                                })
                                renderTotalRW()
                            });
                            changeBtnState(btnV, item[key])
                            td.appendChild(btnV);
                            tr.appendChild(td);
                            break;
                        case "insurance_related":
                            //健保顯示的icon
                            if (Editor == 1) {
                                const _h = document.createElement("img")
                                _h.src = item["insurance_related"] == 1 ? "./img/health1.svg" : "./img/health0.svg"
                                td.appendChild(_h)
                                tr.appendChild(td);
                            }
                            break;
                    }


                }
                box.appendChild(tr)
            });

            //設定右下完成按鈕的功能
            const cbtn = document.querySelector("#codeCtrl .footer button.complete")
            cbtn.classList.remove(...cbtn.classList);
            cbtn.classList.add("main", "complete", data[0].source)
            cbtn.innerHTML = data[0].source.replace(replaceWhitwSpace, " ") + "完成";
        }

        // 查找关键字按钮
        const findBtns = (keyword) => {
            const content = document.querySelector("#myArtical .content .ENG");
            let reg = new RegExp(keyword, 'g');
            let artical = content.innerHTML;
            return [...artical.matchAll(reg)];
        }

        //標記所有關鍵字
        spantxtBox.map(item => {
            const content = document.querySelector("#myArtical .content .ENG");
            let artical = content.innerHTML;
            let reg = new RegExp(item.span_txt, 'gi');
            if (artical.match(reg)) {
                content.innerHTML = artical.replace(reg, `<span class="mark ${item.source} code${item.code} close ">${item.span_txt}</span>`);
            }
        })

        // 搜索关键字并高亮显示
        const doSearch = (keyword, source, index) => {
            document.querySelectorAll(`.mark.${source}`).forEach(item => {
                if (item.innerHTML == keyword) {
                    const content = document.querySelector("#myArtical .content .ENG");
                    const itemY = item.offsetTop - content.offsetTop;
                    content.scrollTo({ top: itemY, behavior: 'smooth' });
                    item.classList.remove("close")
                }
            })
        }

        // 渲染标签
        const tabBox = document.querySelector("#codeCtrl .tabs");
        cleanContainer("#codeCtrl .tabs");
        for (let key in dataPool) {
            const btn = document.createElement('button');
            btn.innerHTML = key.replace(replaceWhitwSpace, " ");
            btn.classList.add(key);
            btn.addEventListener('click', () => {
                tabBox.querySelectorAll("button").forEach(btn => { btn.classList.remove("high") });
                renderRow(dataPool[key], btn);
                btn.classList.add("high");
            });
            tabBox.appendChild(btn);
        }

        // 默认渲染第一个标签
        const firstSource = Object.keys(dataPool)[0];
        if (firstSource) {
            renderRow(dataPool[firstSource]);
            tabBox.querySelector("button").classList.add("high");
        }

        //點選focus眼睛全部開/關
        document.querySelector("#focus").addEventListener("click", event => {
            event.target.classList.toggle("close")
            if (event.target.classList.contains("close")) {
                document.querySelectorAll("#codeRow i.eye").forEach(eye => {
                    eye.classList.remove("fa-eye")
                    eye.classList.add("fa-eye-slash")
                })
                document.querySelectorAll("#myArtical .content .ENG .mark").forEach(mark => { mark.classList.add("close") })
                for (key in dataPool) { dataPool[key].map(item => { item.eye = 0 }) }
            } else {
                document.querySelectorAll("#codeRow i.eye").forEach(eye => {
                    eye.classList.remove("fa-eye-slash")
                    eye.classList.add("fa-eye")
                })
                document.querySelectorAll("#myArtical .content .ENG .mark").forEach(mark => { mark.classList.remove("close") })
                for (key in dataPool) { dataPool[key].map(item => { item.eye = 1 }) }
            }
        })
    }

    // 渲染病例列表
    const renderCodeList = list => {
        cleanContainer(".modal.codeList .content .not");
        cleanContainer(".modal.codeList .content .queue");
        cleanContainer(".modal.codeList .content .done");
        list.caseList.map(item => {
            const caseBtn = document.createElement("button");
            caseBtn.innerHTML = item.case;
            if (CaseID == item.case) caseBtn.classList.add("current");
            switch (parseInt(item.state)) {
                case -1:
                    caseBtn.classList.add("not");
                    document.querySelector(".modal.codeList .content .not").appendChild(caseBtn);
                    break;
                case 0:
                    caseBtn.classList.add("queue");
                    document.querySelector(".modal.codeList .content .queue").appendChild(caseBtn);
                    break;
                case 1:
                    caseBtn.classList.add("done");
                    document.querySelector(".modal.codeList .content .done").appendChild(caseBtn);
                    break;
            }
            if (item.state != 0) {
                caseBtn.addEventListener("click", () => {
                    // 重新加载页面并传递新的 CaseID
                    window.location.href = `./?CaseID=${item.case}&ProjectID=${ProjectID}${Editor == 1 && "&Editor=1"}`;
                })
            }
        })
    }

    // 发送已编辑的数据到 API
    const sendData = () => {
        let paragraphsData = [];
        for (let key in dataPool) {
            paragraphsData.push({
                "type": key, // 根据实际的段落类型调整
                "code_list": dataPool[key].map(item => ({
                    "source": item.source,
                    "code": item.code,
                    "check": item.check, // 0未处理, -1错误, 1正确
                    "insurance_related": item.insurance_related || 0 // 如果未设置，默认为0
                }))
            });
        }

        let payload = {
            "project_id": ProjectID,
            "case": CaseID,
            "paragraphs": paragraphsData
        };

        // 发送数据到 API
        contentLoader(
            `${config.API_PATH}/code/status`,
            payload
        )
            .then(response => {
                if (response.meta && response.meta.code === 200) {
                    console.log("数据提交成功");
                } else {
                    throw new Error("数据提交失败");
                }
            })
            .catch(error => {
                console.error(error);
            })
    }

    const sendDataEdit=()=>{
        const desciprtion = document.querySelector(".aboutPanel #description").innerHTML
        const sendData={...editData, desciprtion}//加上備註資料在送出
        console.log(sendData)
        alert("模擬送出")
    }

    // 设置按钮和事件处理程序
    const buttonsSetting = (config) => {
        //下一筆
        document.querySelector(".nextCase").addEventListener("click", () => {
            contentLoader(
                //`${config.API_PATH}/case/list`,
                "./js/GetCaseListByProjectID.json",
                {
                    "project_id": ProjectID,
                    "page": 1,
                    "page_size": 20
                }
            )
                .then(res => {
                    let _current;
                    let _findCase;
                    res.caseList.map(item => {
                        if (_current && !_findCase && _current.state == item.state) _findCase = item.case;
                        if (item.case == CaseID) _current = item;
                    })
                    if (!_findCase) {
                        for (let i = 0; i < res.caseList.length; i++) {
                            console.log(i)
                            if (res.caseList[i].state == _current.state) {
                                _findCase = res.caseList[i].case
                                break
                            }
                        }
                    }
                    window.location.href = `./?CaseID=${_findCase}&ProjectID=${ProjectID}${Editor == 1 && "&Editor=1"}`;
                })
                .catch(error => {
                    console.error(error);
                })
        })

        // 打开病例列表
        document.querySelector(".caselist").addEventListener("click", () => {
            document.querySelector(".modal.codeList").classList.remove("close");
            contentLoader(
                //`${config.API_PATH}/case/list`,
                "./js/GetCaseListByProjectID.json",
                {
                    "project_id": ProjectID,
                    "page": 1,
                    "page_size": 20
                }
            )
                .then(res => {
                    if (res.meta && res.meta.code === 200) {
                        renderCodeList(res);
                    } else {
                        throw new Error("加载病例列表失败");
                    }
                })
                .catch(error => {
                    console.error(error);
                })
        })

        // 关闭模态框
        document.querySelectorAll(".modal .closeBtn").forEach(closeBtn => {
            closeBtn.addEventListener("click", () => {
                document.querySelectorAll(".modal").forEach(modal => {
                    modal.classList.add("close");
                })
            })
        })

        // 打开发送数据的模态框
        document.querySelector(".nav .send").addEventListener("click", () => {
            document.querySelector(".modal.sendCheck").classList.remove("close");
        })

        // 发送数据
        document.querySelector(".doSend").addEventListener("click", () => {
            document.querySelector(".modal.sendCheck").classList.add("close");
            sendData();
        }/*,{ once: true }*/)

         // 送出修改資料前
         document.querySelector(".aboutPanel .footer button").addEventListener("click", () => {
            document.querySelector(".modal.aboutCheck").classList.remove("close");
        }/*,{ once: true }*/)
        
         // 发送数据
         document.querySelector(".doSendEdit").addEventListener("click", () => {
            document.querySelector(".modal.aboutCheck").classList.add("close");
            sendDataEdit();
        }/*,{ once: true }*/)


        const cleanAboutPanel = ()=>{
            const _b=document.querySelector(".modal.aboutPanel .badge");
            _b.innerHTML = "";
            _b.classList.remove(..._b.classList)
            _b.classList.add("badge");
            document.querySelector(".modal.aboutPanel .code").innerHTML=""
            document.querySelector(".modal.aboutPanel .codeName").value=null
            document.querySelector(".modal.aboutPanel #description").value=null
            editData = {}
        }

        //編輯者建立關鍵字按鈕的面板開關
        if (Editor == 1) {
            const fbtn = document.createElement("button")
            fbtn.classList.add("main", "fill")
            fbtn.innerHTML = "補充"
            document.querySelector("#codeCtrl .footer").appendChild(fbtn)
            fbtn.addEventListener("click", () => {
                cleanAboutPanel()
                document.querySelector(".modal.aboutPanel").classList.remove("close")
                document.querySelector(".modal.aboutPanel .openkeyWordPanel").classList.add("outline")
                document.querySelector(".modal.aboutPanel .openkeyWordPanel").innerHTML = "選擇文字範圍"
                document.querySelector(".modal.aboutPanel .footer button").classList.add("disabled")
            })
        }

        //左側的補充按鈕，開啟補充視窗
        const selectTxt = document.querySelector("#myArtical .content .selectTxt")
        selectTxt.addEventListener("click", () => {
            document.querySelector(".modal.aboutPanel").classList.remove("close")
            selectTxt.classList.add("close")
            checkAboutPanel()
        })

        //左側文章文字擷取，擷取完後會彈出補充按鈕，點選後開啟補充視窗
        if(Editor==1){
            document.querySelector("#myArtical .content .ENG").addEventListener("mouseup", event => {
                if (window.getSelection().toString()) {
                    selectTxt.classList.remove("close")
                    selectTxt.style.top = `${event.pageY + 20}px`
                    selectTxt.style.left = `${event.pageX + 20}px`
                    document.querySelector(".modal.aboutPanel .openkeyWordPanel").classList.remove("outline")
                    document.querySelector(".modal.aboutPanel .openkeyWordPanel").innerHTML = window.getSelection().toString()
                    editData.span_txt = window.getSelection().toString()
                    setTimeout(() => {
                        selectTxt.classList.add("close")
                    }, 5000);
                }
            })
        }

        //補充視窗內的文字擷取
        document.querySelector(".modal.keyWordPanel .selectKeyWordFromArtical").addEventListener("mouseup", () => {
            const confirmBtn = document.querySelector(".modal.keyWordPanel .footer button")
            confirmBtn.classList.add("disabled")
            if (window.getSelection().toString()) {
                confirmBtn.classList.remove("disabled")
                document.querySelector(".modal.aboutPanel .openkeyWordPanel").classList.remove("outline")
                document.querySelector(".modal.aboutPanel .openkeyWordPanel").innerHTML = window.getSelection().toString()
                editData.span_txt = window.getSelection().toString()
            }
        })

        //補充文字確認送出
        document.querySelector(".modal.keyWordPanel .footer button").addEventListener("click", () => {
            document.querySelector(".modal.aboutPanel").classList.remove("close")
            checkAboutPanel()
        })

        //建立右下方完成按鈕 點下後會等同於點選tab中的下一個選項 最後一個會循環
        const cbtn = document.createElement("button")
        document.querySelector("#codeCtrl .footer").appendChild(cbtn)
        cbtn.classList.add("complete")
        cbtn.addEventListener("click", () => {
            const _p = document.querySelector("#codeCtrl .tabs");
            const _t = document.querySelector("#codeCtrl .tabs .high");
            if (Array.from(_p.children).indexOf(_t) == Array.from(_p.children).length - 1) {
                Array.from(_p.children)[0].click()
            } else {
                _t.nextSibling.click()
            }
        }/*, { once: true }*/)

        //補充視窗，打開文字選取視窗按鈕
        document.querySelector(".openkeyWordPanel").addEventListener("click", () => {
            document.querySelector(".modal.aboutPanel").classList.add("close")
            document.querySelector(".modal.keyWordPanel").classList.remove("close")
        })
    }

    // 文章语言切换设置
    const changeArticalLang = artical => {
        let sw = true;
        const _cht = document.querySelector("#myArtical .content .CHT")
        const _eng = document.querySelector("#myArtical .content .ENG")
        _cht.innerHTML = artical.paragraphs.map(p => p.cht).join('<br><br>');
        _eng.innerHTML = artical.paragraphs.map(p => p.eng).join('<br><br>');
        const changeArtical = (lang) => {
            if (lang == "CHT") {
                _cht.classList.remove("close")
                _eng.classList.add("close")
            } else {
                _cht.classList.add("close")
                _eng.classList.remove("close")
            }
        }
        changeArtical(sw ? "ENG" : "CHT");
        document.querySelector("#myArtical .switch input").addEventListener("click", e => {
            sw = !sw;
            changeArtical(sw ? "ENG" : "CHT");
        })
    }

    // 初始化
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelector(".nav span.caseID").innerHTML = CaseID;
        document.querySelector("header span.projectID").innerHTML = ProjectID;
        // 加载配置文件
        loadConfig().then(res => {
            config = res;
            buttonsSetting(config);
            // 获取病例内容
            return contentLoader("./js/GetCaseContent.json")//測試用
            return contentLoader(
                `${config.API_PATH}/case/content`,
                {
                    "project_id": ProjectID,
                    "case": CaseID
                }
            )
        }).then(artical => {
            if (artical.meta && artical.meta.code === 200) {

                document.querySelector(".selectKeyWordFromArtical").innerHTML = artical.paragraphs.map(p => p.eng).join('<br><br>');

                //選取範圍
                changeArticalLang(artical);
                // 获取病例详细信息
                return contentLoader("./js/GetCaseDetail.json")//測試用
                return contentLoader(
                    `${config.API_PATH}/case/detail`,
                    {
                        "project_id": ProjectID,
                        "case": CaseID
                    }
                )
            } else {
                throw new Error("加载病例内容失败");
            }
        }).then(items => {
            if (items.meta && items.meta.code === 200) {
                renderCodePanel(items);
                renderTotalRW()
                return contentLoader("./js/getCodeNameList.json")
            } else {
                throw new Error("加载病例详细信息失败");
            }
        }).then(list => {

            //設定補充面板的自動完成的區塊
            autocomplete(
                document.querySelector(".modal.aboutPanel input.codeName"),
                list.codeList,
                data => { 
                    afterAutocomplete(data)
                }
            );

        }).catch(error => {
            console.error(error);
        })
    })
})()


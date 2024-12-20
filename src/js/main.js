/*
    1. 程式進入點由最下方的init處開始
    2. 由於json在讀取空白字元會出現錯誤，所以json的檔案暫時使用底線取代空白字元，讀取完後再取代
*/
(() => {
    let org;//文章原始文
    let config;//設定物件
    let dataPool = {}  //從GetCaseDetail取得的rowdata
   
    const CaseID = new URL(window.location.href).searchParams.get('CaseID'); //從url取得CaseID參數
    const ProjectID = "951e7f53-4eea-4abe-9298-0afbc984f508"; //目前不知道PID的取得來源？
    const replaceWhitwSpace= "_"//取代的空白字元
    
    const cleanContainer = (target) => {
        const container = document.querySelector(target)
        while (container.firstChild) {
            container.removeChild(container.lastChild)
        }
    }

    //讀取設定檔
    const loadConfig = () => {
        return new Promise((resolve, reject) => {
            fetch("./js/config.json", {
                method: 'GET',
            }).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.log("連線失敗");
                    return null;
                }
            }).then(result => {
                resolve(result)
            }).catch(error => {
                console.error(error);
            })
        })
    }

    //讀取資料 目前都是讀取本機json的資料 這部分在看您要如何修改
    const contentLoader = (path, params) => {
        let formData = new FormData();
        if (params) {

            params.forEach(item => {
                formData.append(item.key, item.value);
            })
        }

        return new Promise((resolve, reject) => {
            fetch(path, {
                method: 'GET',
                //body: formData
            }).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.log("連線失敗");
                    return null;
                }
            }).then(result => {
                resolve(result)
            }).catch(error => {
                console.error(error);
            })
        })
    }
    
    //設定右方功能欄
    const renderCodePanel = items =>{
        
        const findBtns = (keyword) => {
            const content = document.querySelector("#myArtical .content")
            content.innerHTML = org
            let reg = new RegExp(keyword, 'g');
            let artical = content.innerHTML;
            return [...artical.matchAll(reg)]
        }

        //關鍵字尋找的功能
        const doSearch = (keyword, type, index) => {
            const content = document.querySelector("#myArtical .content")
            content.innerHTML = org
            let artical = content.innerHTML;
            let reg = new RegExp(keyword, 'i');
            let tempA;//safari因為會有畫面刷新的bug所以先存一份起來畫面捲動完成再貼回去一次
            if (artical.match(reg)) {
                content.innerHTML = artical.replaceAll(keyword, `<span class="mark ${type}">${keyword}</span>`)
                content.addEventListener("scrollend",ev=>{
                    console.log("scroll")
                })
                content.querySelectorAll(".mark").forEach((item, _i) => {
                    if (_i == index) {
                        item.classList.add("high")
                        tempA = content.innerHTML //備份
                        const itemY = item.offsetTop - content.offsetTop
                        content.scrollTo({ top: itemY, behavior: 'smooth' });
                        setTimeout(() => { content.innerHTML  = tempA }, 200)//貼回去
                    }
                })
            }
        }

        items.codelist.map(item => {
            if (dataPool[item.source] == undefined) {
                dataPool[item.source] = []
            }
            dataPool[item.source].push(item)
        })
        
        
        //每一條code資料的內容
        const renderRow = (data) => {
            const box = document.querySelector("#codeRow")
            cleanContainer("#codeRow")
            data.map((item, sn) => {
                const tr = document.createElement("tr");
                tr.style.animationDelay = `${sn * 100}ms`
                //first td
                const td = document.createElement("td");
                const eye = document.createElement("img");
                eye.src = "./img/eye0.svg"
                eye.addEventListener("click",event=>{
                    event.target.src.match("eye0.svg")?
                        event.target.src="./img/eye1.svg":
                        event.target.src="./img/eye0.svg"
                })                    
                td.appendChild(eye)
                tr.appendChild(td)
                //after first td
                for (let key in item) {
                    const td = document.createElement("td");
                    td.classList.add(key)

                    switch (key) {
                        case "spantxt":
                            const box = document.createElement("div");
                            box.classList.add("spanTxtBox")
                            findBtns(item[key]).map((val, index) => {
                                const btn = document.createElement("button");
                                btn.innerHTML = item[key]
                                btn.classList.add(item["source"])
                                btn.addEventListener("click", () => {
                                    doSearch(item[key], item["source"], index)
                                })
                                box.appendChild(btn)
                            })
                            td.appendChild(box)
                            break
                        case "source":
                            const badge = document.createElement("div")
                            badge.classList.add("badge", item["source"])
                            badge.innerHTML = item[key].replace(replaceWhitwSpace, " ")
                            td.appendChild(badge)
                            break
                        case "code":
                            //td.classList.add("high")
                            td.classList.add(item["source"])
                            td.innerHTML = item[key]
                            break
                        case "check":
                            const btnX = document.createElement("img");
                            btnX.dataset.code = item['code']
                            btnX.addEventListener("click", event => {
                                btnX.src = "./img/checkx1.svg"
                                btnV.src = "./img/checkv0.svg"
                                dataPool[item["source"]].forEach(d=>{
                                    if(d.code == event.target.dataset.code) d.check=1
                                })
                            })
                            const btnV = document.createElement("img");
                            btnV.dataset.code = item['code']
                            btnV.addEventListener("click", event => {
                                btnX.src = "./img/checkx0.svg"
                                btnV.src = "./img/checkv1.svg"
                                dataPool[item["source"]].forEach(d=>{
                                    if(d.code == event.target.dataset.code) d.check=2
                                })
                            })
                            if (item[key] == 1) {
                                btnX.src = "./img/checkx1.svg"
                                btnV.src = "./img/checkv0.svg"
                            } else if (item[key] == 2) {
                                btnX.src = "./img/checkx0.svg"
                                btnV.src = "./img/checkv1.svg"
                            } else {
                                btnX.src = "./img/checkx0.svg"
                                btnV.src = "./img/checkv0.svg"
                            }
                            td.appendChild(btnX)
                            td.appendChild(btnV)
                            break

                        default:
                            td.innerHTML = item[key]
                    }
                    tr.appendChild(td)
                }
                box.appendChild(tr)
            })
        }

        const tabBox = document.querySelector("#codeCtrl .tabs")
        for (let key in dataPool) {
            const btn = document.createElement('button')
            btn.innerHTML = key.replace("_", " ")
            btn.classList.add(key)
            btn.addEventListener('click', () => {
                const content = document.querySelector("#myArtical .content")
                content.scrollTo({ top: 0 });
                content.innerHTML  = org

                tabBox.querySelectorAll("button").forEach(btn => { btn.classList.remove("high") })
                renderRow(dataPool[key], btn)
                btn.classList.add("high")
            })
            tabBox.appendChild(btn)

        }
        renderRow(dataPool['ICD-10'])
        tabBox.querySelector("button").classList.add("high")
    }

    //按鈕『選擇病例』開啟後的視窗
    const renderCodeList = list => {
        cleanContainer(".modal.codeList .content .not")
        cleanContainer(".modal.codeList .content .queue")
        cleanContainer(".modal.codeList .content .done")
        list.caseList.map(item => {
            const caseBtn = document.createElement("button")
            caseBtn.innerHTML = item.caseName
            if(CaseID == item.caseName) caseBtn.classList.add("current")
            switch(parseInt(item.state)){
                case 0:
                    caseBtn.classList.add("not")
                    document.querySelector(".modal.codeList .content .not").appendChild(caseBtn)
                    break
                case 1:
                    caseBtn.classList.add("queue")
                    document.querySelector(".modal.codeList .content .queue").appendChild(caseBtn)
                    break
                case 2:
                    caseBtn.classList.add("done")
                    document.querySelector(".modal.codeList .content .done").appendChild(caseBtn)
                    break
            }
            caseBtn.addEventListener("click",()=>{
                //這邊我先做轉跳處理，如果不想用轉跳的方式也可以另外處理～
                window.open("./?CaseID="+item.caseName,"_self")
            })
        })
    }

    //送出已經編輯的資料
    const sendData = ()=>{
        let collectData=[];//要送出的審核資料
        for(let key in dataPool){
            dataPool[key].map(item=>{
                collectData.push({code:item.code, check:item.check})
            })
        }        
        //模擬送出
        if(confirm("模擬送出")){
            console.log(collectData) // <=這包就是已經編輯完後的資料
        }
    } 

    //所有按鈕初始設定
    const buttonsSetting =(config)=>{ 
        document.querySelector(".caselist").addEventListener("click", ()=>{
            document.querySelector(".modal.codeList").classList.remove("close")
            //contentLoader(`${config.API_PATH}/GetCaseListByProjectID` ).then(res=>{
            contentLoader("./js/GetCaseListByProjectID.json" ).then(res=>{ //測試用
                renderCodeList(res)
            })            
        })

        document.querySelectorAll(".modal .closeBtn").forEach(closeBtn=>{
            closeBtn.addEventListener("click", ()=>{
                document.querySelectorAll(".modal").forEach(modal=>{
                    modal.classList.add("close")
                })
            })
        })

        //開啟送出資料視窗
        document.querySelector(".nav .send").addEventListener("click", ()=>{
            document.querySelector(".modal.sendCheck").classList.remove("close")
        })

        //送出資料
        document.querySelector(".doSend").addEventListener("click", ()=>{
            document.querySelector(".modal.sendCheck").classList.add("close")
            sendData()
        })
    }

    //文章語系切換設定
    const changeArticalLang =(artical)=>{
        let sw = true;
        const changeArtical = (lang) => {
            if (lang == "CHT") {
                document.querySelector("#myArtical .content").innerHTML = artical.CHT.replace(replaceWhitwSpace, " ")
                org = artical.CHT
            } else {
                document.querySelector("#myArtical .content").innerHTML = artical.ENG.replace(replaceWhitwSpace, " ")
                org = artical.ENG
            }
        }
        changeArtical(sw ? "ENG" : "CHT")
        document.querySelector("#myArtical .switch input").addEventListener("click", e => {
            sw = !sw
            changeArtical(sw ? "ENG" : "CHT")
        })
    }

    //init 進入點
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelector(".nav span.caseID").innerHTML = CaseID
        document.querySelector("header span.projectID").innerHTML = ProjectID
        //讀取設定檔
        loadConfig().then(res => {
            config = res
            buttonsSetting(config)
            //return contentLoader(`${config.API_PATH}/GetCaseContent`)
            return contentLoader("./js/GetCaseContent.json")//測試用
        }).then(artical => {
            changeArticalLang(artical)
            //return contentLoader(`${config.API_PATH}/GetCaseDetail`)
            return contentLoader("./js/GetCaseDetail.json")//測試用
        }).then(items => {
            renderCodePanel(items)
        })
    })
})()
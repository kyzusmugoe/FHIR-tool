(() => {
    let API_URL;
    let org;//文章原始文
    const PID = new URL(window.location.href).searchParams.get('pid');
    const cleanContainer = (target) => {
        const container = document.querySelector(target)
        while (container.firstChild) {
            container.removeChild(container.lastChild)
        }
    }

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

    const findBtns = (keyword) => {
        const content = document.querySelector("#myArtical .content")
        content.innerHTML = org
        let reg = new RegExp(keyword, 'g');
        let artical = content.innerHTML;
        return [...artical.matchAll(reg)]
    }
  
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

    //init
    document.addEventListener("DOMContentLoaded", () => {
        loadConfig().then(res => {
            API_URL = res.API_URL
            return contentLoader("./js/GetCaseContent.json")
        }).then(artical => {
            let sw = true;
            const changeArtical = (lang) => {
                if (lang == "CHT") {
                    document.querySelector("#myArtical .content").innerHTML = artical.CHT
                    org = artical.CHT
                } else {
                    document.querySelector("#myArtical .content").innerHTML = artical.ENG
                    org = artical.ENG
                }
            }
            changeArtical(sw ? "ENG" : "CHT")
            document.querySelector("#myArtical .switch input").addEventListener("click", e => {
                sw = !sw
                changeArtical(sw ? "ENG" : "CHT")
            })

            return contentLoader("./js/GetCaseDetail.json")
        }).then(items => {
            const dataPool = {}
            items.codelist.map(item => {
                //console.log(item)
                if (dataPool[item.source] == undefined) {
                    dataPool[item.source] = []
                }
                dataPool[item.source].push(item)

            })

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
                                        //if(btn != currentBtn){
                                            doSearch(item[key], item["source"], index)
                                           // currentBtn = btn
                                        //}
                                    })
                                    box.appendChild(btn)
                                })
                                td.appendChild(box)
                                break
                            case "source":
                                const badge = document.createElement("div")
                                badge.classList.add("badge", item["source"])
                                badge.innerHTML = item[key].replace("_", " ")
                                td.appendChild(badge)
                                break
                            case "code":
                                //td.classList.add("high")
                                td.classList.add(item["source"])
                                td.innerHTML = item[key]
                                break
                            case "check":
                                const btnX = document.createElement("img");
                                btnX.addEventListener("click", () => {
                                    btnX.src = "./img/checkx1.svg"
                                    btnV.src = "./img/checkv0.svg"
                                })
                                const btnV = document.createElement("img");
                                btnV.addEventListener("click", () => {
                                    btnX.src = "./img/checkx0.svg"
                                    btnV.src = "./img/checkv1.svg"
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
        })
    })

})()
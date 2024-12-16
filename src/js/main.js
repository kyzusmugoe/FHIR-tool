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
        if(params){

            params.forEach(item=>{
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

    const findBtns=(keyword)=>{
        const content =document.querySelector("#myArtical .content")
        content.innerHTML = org
        let reg = new RegExp(keyword, 'g');
        let artical = content.innerHTML;
        return [...artical.matchAll(reg)]
    }

    const doSearch = (keyword, index) => {
        const content =document.querySelector("#myArtical .content")
        content.innerHTML = org
        //let keyword = document.querySelector("#keyword").value;
        let artical = content.innerHTML;
       
        let reg = new RegExp(keyword, 'i');
        if (artical.match(reg)) {
            //cleanContainer(".btns")
            content.innerHTML = artical.replaceAll(keyword, '<span class="mark">' + keyword + '</span>')
            content.querySelectorAll(".mark").forEach((item, _i) => {
                if(_i == index){
                    item.classList.add("high")
                    const itemY = item.getBoundingClientRect().y - 10
                    content.scrollTop = itemY
                }
                /*
                btn = document.createElement("button")
                btn.innerHTML = keyword
                document.querySelector(".btns").appendChild(btn)
                const itemY = item.getBoundingClientRect().y - 10
                btn.addEventListener("click", () => {
                    _a.querySelectorAll(".focus").forEach(btn => {
                        btn.classList.remove("focus")
                    })
                    item.classList.add("focus")
                    _a.scrollTop = itemY
                })
                */
            })

        }
    }



    

    //init
    document.addEventListener("DOMContentLoaded",()=>{
        loadConfig().then(res => {
            API_URL = res.API_URL
            return contentLoader("./js/GetCaseContent.json")
        }).then(artical=>{
            let sw = true;
            const changeArtical =(lang)=>{
                if(lang=="CHT"){
                    document.querySelector("#myArtical .content").innerHTML = artical.CHT
                    org=artical.CHT
                }else{
                    document.querySelector("#myArtical .content").innerHTML = artical.ENG
                    org=artical.ENG
                }
            }
            changeArtical(sw?"ENG":"CHT")
            document.querySelector("#myArtical .switch input").addEventListener("click", e => {
                sw = !sw
                changeArtical(sw?"ENG":"CHT")
            })
            
            return contentLoader("./js/GetCaseDetail.json")
        }).then(items=>{
            const dataPool={}
            items.codelist.map(item=>{
                //console.log(item)
                if(dataPool[item.source] == undefined){
                    dataPool[item.source] = []
                }
                dataPool[item.source].push(item)
            
            })

            const renderRow = (data)=>{
                const box = document.querySelector("#codeRow")
                cleanContainer("#codeRow")
                data.map(item=>{
                    const tr = document.createElement("tr");
                    //console.log(item)
                    for(let key in item)
                    {
                        const td = document.createElement("td");
                        td.classList.add(key)
                        switch(key){
                            case "spantxt":
                                const box = document.createElement("div");
                                box.classList.add("spanTxtBox")
                                findBtns(item[key]).map((val, index)=>{
                                    const btn = document.createElement("button");
                                    btn.innerHTML = item[key]
                                    btn.addEventListener("click",()=>{

                                        doSearch(item[key], index)
                                    })
                                    box.appendChild(btn)
                                })
                                td.appendChild(box)
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

            for(let key in dataPool )
            {
                const btn = document.createElement('button')
                btn.innerHTML = key
                btn.addEventListener('click', ()=>{
                    renderRow(dataPool[key])
                    
                })
                tabBox.appendChild(btn)
                
            }
            renderRow(dataPool['icd10'])

            //dataPool.map()
            
        })
    })

})()
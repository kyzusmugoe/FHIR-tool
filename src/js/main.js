(() => {
    let API_URL;
    const org = document.querySelector("#myArtical").innerHTML;
    const PID = new URL(window.location.href).searchParams.get('pid');
    
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

    const doSearch = () => {
        document.querySelector("#myArtical").innerHTML = org
        let keyword = document.querySelector("#keyword").value;
        let artical = document.querySelector("#myArtical").innerHTML;
        if (keyword == undefined || keyword == "") {
            console.log("您尚未輸入關鍵字。")
            return
        }
        let reg = new RegExp(keyword, 'i');
        if (artical.match(reg)) {
            cleanBtnBox()
            const _a = document.querySelector("#myArtical")
            _a.innerHTML = artical.replaceAll(keyword, '<span class="high">' + keyword + '</span>')
            _a.querySelectorAll(".high").forEach(item => {
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
            })
        }
    }

    const cleanBtnBox = () => {
        const container = document.querySelector(".btns")
        while (container.firstChild) {
            container.removeChild(container.lastChild)
        }
    }

    

    //init
    document.addEventListener("DOMContentLoaded",()=>{
        loadConfig().then(res => {
            API_URL = res.API_URL
            //search 
            document.querySelector("#Search").addEventListener("click", () => {
                doSearch()
            })
            return contentLoader("./js/GetCaseContent.json")
        }).then(artical=>{
            let sw = true;
            const changeArtical =(lang)=>{
                if(lang=="CHT"){
                    document.querySelector("#myArtical .content").innerHTML = artical.CHT
                }else{
                    document.querySelector("#myArtical .content").innerHTML = artical.ENG
                }
            }
            changeArtical(sw?"CHT":"ENG")
            document.querySelector("#myArtical .switch input").addEventListener("click", e => {
                sw = !sw
                changeArtical(sw?"CHT":"ENG")
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

            const renderRow = ()=>{
                
            }

            const tabBox = document.querySelector("#codeCtrl .tabs")
            for(let key in dataPool )
            {
                const btn = document.createElement('button')
                btn.innerHTML = key
                tabBox.appendChild(btn)
                console.log(key)
            }

            //dataPool.map()
            
        })
    })

})()
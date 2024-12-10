const org = document.querySelector("#myArtical").innerHTML;

document.querySelector("#Search").addEventListener("click", ()=>{
    doSearch()
})


//load config.json
const loadConfig = ()=>{
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
        _a.querySelectorAll(".high").forEach(item=>{
            btn = document.createElement("button")
            btn.innerHTML = keyword 
            document.querySelector(".btns").appendChild(btn)
            const itemY = item.getBoundingClientRect().y - 10
            btn.addEventListener("click", ()=>{
                _a.querySelectorAll(".focus").forEach(btn=>{
                    btn.classList.remove("focus")
                })
                item.classList.add("focus")
                _a.scrollTop = itemY
            })
        })
    }
}

const cleanBtnBox =()=>{
    const container = document.querySelector(".btns")
    while (container.firstChild) {
        container.removeChild(container.lastChild)
    }
}


loadConfig().then(res=>{
    console.log(res)
})
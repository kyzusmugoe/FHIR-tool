(() => {
    let org; // 原始文章文本
    let config; // 配置对象
    let dataPool = {}; // 从 GetCaseDetail 获取的原始数据

    // 从 URL 获取 CaseID 和 ProjectID 参数
    const CaseID = new URL(window.location.href).searchParams.get('CaseID');
    const ProjectID = new URL(window.location.href).searchParams.get('ProjectID');

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
                body: JSON.stringify(params)
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
            data.map((item, sn) => {
                const tr = document.createElement("tr");
                tr.style.animationDelay = `${sn * 100}ms`;
                // 第一列
                const td = document.createElement("td");
                const eye = document.createElement("img");
                eye.classList.add("eye")
                eye.dataset.code = item['code'];
                eye.src = item.eye == 0 ? "./img/eye0.svg" : "./img/eye1.svg";
                eye.addEventListener("click", event => {
                    findObj(item["source"], event.target.dataset.code, res => {
                        if (res.eye == 0) {
                            res.eye = 1;
                            event.target.src = "./img/eye1.svg";
                            document.querySelectorAll(`#myArtical .content .mark.code${event.target.dataset.code}`).forEach(mark => {
                                mark.classList.remove("close")
                            })
                        } else {
                            res.eye = 0;
                            event.target.src = "./img/eye0.svg";
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
                                        eye.src = "./img/eye1.svg";
                                    })
                                })
                                box.appendChild(btn)
                            })
                            td.appendChild(box)
                            break
                        case "source":
                            const badge = document.createElement("div");
                            badge.classList.add("badge", item["source"]);
                            badge.innerHTML = item[key].replace(replaceWhitwSpace, " ");
                            td.appendChild(badge);
                            break;
                        case "code":
                            td.classList.add(item["source"]);
                            td.innerHTML = item[key];
                            break;
                        case "check":
                            const changeBtnState = (_x, _v, _val) => {
                                if (_val == -1) {
                                    _x.src = "./img/checkx1.svg";
                                    _v.src = "./img/checkv0.svg";
                                } else if (_val == 1) {
                                    _x.src = "./img/checkx0.svg";
                                    _v.src = "./img/checkv1.svg";

                                } else {
                                    _x.src = "./img/checkx0.svg";
                                    _v.src = "./img/checkv0.svg";
                                }
                            }
                            const btnX = document.createElement("img");
                            const btnV = document.createElement("img");
                            btnX.dataset.code = item['code'];
                            btnX.addEventListener("click", event => {
                                findObj(item["source"], event.target.dataset.code, (d) => {
                                    d.check == 0 || d.check == 1 ?
                                        d.check = -1 :
                                        d.check = 0;
                                    changeBtnState(btnX, btnV, d.check)
                                })
                            });

                            btnV.dataset.code = item['code'];
                            btnV.addEventListener("click", event => {
                                findObj(item["source"], event.target.dataset.code, (d) => {
                                    d.check == 0 || d.check == -1 ?
                                        d.check = 1 :
                                        d.check = 0;
                                    changeBtnState(btnX, btnV, d.check)
                                })
                            });
                            changeBtnState(btnX, btnV, item[key])
                            td.appendChild(btnX);
                            td.appendChild(btnV);
                            break;
                        default:
                            td.innerHTML = item[key];
                    }
                    if (key != "eye") {
                        tr.appendChild(td);
                    }
                }
                box.appendChild(tr);
            });
        }

        // 查找关键字按钮
        const findBtns = (keyword) => {
            const content = document.querySelector("#myArtical .content");
            //content.innerHTML = org;
            let reg = new RegExp(keyword, 'g');
            let artical = content.innerHTML;
            return [...artical.matchAll(reg)];
        }

        //標記所有關鍵字
        spantxtBox.map(item => {
            const content = document.querySelector("#myArtical .content");
            let artical = content.innerHTML;
            let reg = new RegExp(item.span_txt, 'gi');
            let tempA;
            if (artical.match(reg)) {
                content.innerHTML = artical.replace(reg, `<span class="mark ${item.source} code${item.code} close ">${item.span_txt}</span>`);
            }
        })

        // 搜索关键字并高亮显示
        const doSearch = (keyword, source, index) => {
            document.querySelectorAll(`.mark.${source}`).forEach(item => {
                if (item.innerHTML == keyword) {
                    const content = document.querySelector("#myArtical .content");
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
            btn.innerHTML = key.replace("_", " ");
            btn.classList.add(key);
            btn.addEventListener('click', () => {
                //const content = document.querySelector("#myArtical .content");
                //content.scrollTo({ top: 0 });
                //content.innerHTML = org;

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
                case 0:
                    caseBtn.classList.add("not");
                    document.querySelector(".modal.codeList .content .not").appendChild(caseBtn);
                    break;
                case 1:
                    caseBtn.classList.add("queue");
                    document.querySelector(".modal.codeList .content .queue").appendChild(caseBtn);
                    break;
                case 2:
                    caseBtn.classList.add("done");
                    document.querySelector(".modal.codeList .content .done").appendChild(caseBtn);
                    break;
            }
            caseBtn.addEventListener("click", () => {
                // 重新加载页面并传递新的 CaseID
                window.location.href = `./?CaseID=${item.case}&ProjectID=${ProjectID}`;
            })
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
                    // 根据需要处理响应
                } else {
                    throw new Error("数据提交失败");
                }
            })
            .catch(error => {
                console.error(error);
                // 错误处理
            })
    }

    // 设置按钮和事件处理程序
    const buttonsSetting = (config) => {
        // 打开病例列表
        document.querySelector(".caselist").addEventListener("click", () => {
            document.querySelector(".modal.codeList").classList.remove("close");
            contentLoader(
                `${config.API_PATH}/case/list`,
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
                    // 错误处理
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
        })
    }

    // 文章语言切换设置
    const changeArticalLang = artical => {
        let sw = true;
        const changeArtical = (lang) => {
            if (lang == "CHT") {
                document.querySelector("#myArtical .content").innerHTML = artical.paragraphs.map(p => p.cht).join('<br><br>');
                org = artical.paragraphs.map(p => p.cht).join('<br><br>');
            } else {
                document.querySelector("#myArtical .content").innerHTML = artical.paragraphs.map(p => p.eng).join('<br><br>');
                org = artical.paragraphs.map(p => p.eng).join('<br><br>');
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
            // const testa= config["test a"]
            // document.querySelector(".nav span.caseID").innerHTML = testa
            //return contentLoader("./js/GetCaseContent.json")//測試用
            return contentLoader(
                `${config.API_PATH}/case/content`,
                {
                    "project_id": ProjectID,
                    "case": CaseID
                }
            )
        }).then(artical => {
            if (artical.meta && artical.meta.code === 200) {
                changeArticalLang(artical);
                // 获取病例详细信息
                //return contentLoader("./js/GetCaseDetail.json")//測試用
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
                //console.log(items)
            } else {
                throw new Error("加载病例详细信息失败");
            }
        }).catch(error => {
            console.error(error);
            // 错误处理
        })
    })
})()
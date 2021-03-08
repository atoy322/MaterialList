function start(){
    GetTable();
    setInterval(total_price, 500);
}

function total_price(){
    var sum = 0;
    var h1 = document.getElementById("total_price");
    var prices = document.getElementsByClassName("price");
    var amounts = document.getElementsByClassName("amount");
    

    for(var i=0; i<prices.length; i++){
        sum += parseInt(prices[i].innerHTML.slice(1)) * parseInt(amounts[i].innerHTML);
    }
    h1.innerHTML = "Total price: ￥" + sum.toString();
}

function create_list(json_string){
    var table = document.getElementById("tbl");
    var data = JSON.parse(json_string);
    var cols = ["name", "amount", "price", "place"];
    var input_opts = {
        "name": ["商品名を入力", "text"],
        "url": ["URL", "url"],
        "amount": ["数量", "number"],
        "price": ["価格", "number"],
        "place": ["買う場所", "text"]
    }
    
    for(var i=0; i<data.length; i++){
        var jsn = data[i];
        var tr = document.createElement("tr");
        var menu = document.createElement("tr");
        tr.id = `data${i}`;
        menu.className = "menu";
        menu.display = "none";
        table.appendChild(tr);
        table.appendChild(menu);

        for(var c=0; c<cols.length; c++){
            var col = cols[c];
            var td = document.createElement("td");
            td.className = col + "cell";
            tr.appendChild(td);

            switch(col){
                case "name":
                    td.innerHTML = `<a href=${jsn.url} target="blank_"><span class="name">${jsn.name}</span></a>`;
                    break;
                case "amount":
                    td.innerHTML = `<span class="amount">${jsn.amount}</span>`;
                    break;
                case "price":
                    td.innerHTML = `<span class="price">￥${jsn.price}</span>`;
                    break;
                case "place":
                    td.innerHTML = `<span class="place">${jsn.place}</span>`;
                    break;
            }
        }
        //tr.ontouchstart = click_event;
        tr.onclick = click_event;
        menu.id = `menu${i}`;
    }
    
    var tr = document.createElement('tr');
    table.appendChild(tr);

    cols.forEach(col => {
        var td = document.createElement("td");
        td.className = "input";
        tr.appendChild(td);
        td.innerHTML = `<input id="new${col}" placeholder="${input_opts[col][0]}" type="${input_opts[col][1]}">`;
        
        if(col == "name"){
            td.innerHTML += `<input id="newurl" placeholder="${input_opts["url"][0]}" type="${input_opts["url"][1]}">`;
        }
    });
}

function click_event(evt){
    var element = evt.target;
    var cls = element.className;
    var id = element.id;
    
    if(cls == "name"){
        return;
    }

    do {
        element = element.parentElement;
    }while(element.localName != "tr");

    var clicked = parseInt(element.id.slice(4));
    var menu = document.getElementById(`menu${clicked}`);
    menu.display = "inline";
    menu.innerHTML = '<td colspan="4"><button>Remove</button></td>';
    element.style.backgroundColor = '#ffef90';
}

function GetTable(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'materials.json', true);
    xhr.send(null);
    xhr.onload = () => {
        create_list(xhr.responseText);
    };
}

function RequestMaterial(){
    var sound = new Audio("money.mp3");
    var xhr = new XMLHttpRequest();
    var table = document.getElementById("tbl");
    var nameval = document.getElementById("newname").value;
    var urlval = document.getElementById("newurl").value;
    var amountval = document.getElementById("newamount").value;
    var priceval = document.getElementById("newprice").value;
    var placeval = document.getElementById("newplace").value;

    if((nameval == "")||(urlval == "")||(amountval == "")||(priceval == "")||(placeval == "")){
        alert("空の項目があります");
        return;
    }
    

    xhr.open('POST', 'NewMaterial', true);
    xhr.send(`name|#|${nameval}|&|url|#|${urlval}|&|amount|#|${amountval}|&|price|#|${priceval}|&|place|#|${placeval}`);
    xhr.onload = () => {
        table.innerHTML = '<tr><th><p class="header">名前</p></th><th><p class="header">量</p></th><th><p class="header">価格</p></th><th><p class="header">場所</p></th></tr>';
        create_list(xhr.responseText);
        sound.play();
    };
}

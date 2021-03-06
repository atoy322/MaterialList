var coin = new Audio("money.mp3");

function start(){
    GetJson();
    setInterval(total_price, 500);
}

function total_price(){
    var sum = 0;
    var h1 = document.getElementById("total_price");
    var prices = document.getElementsByClassName("price");
    

    for(var i=0; i<prices.length; i++){
        sum += parseInt(prices[i].innerHTML.slice(1));
    }
    h1.innerHTML = "Total price: ￥" + sum.toString();
}

function create_list(json_string){
    var table = document.getElementById('tbl');
    var data = JSON.parse(json_string);
    
    data.forEach(jsn => {
        var tr = document.createElement('tr');
        tr.className = "row";
        table.appendChild(tr);
        
        tr.innerHTML = `<td id="namecell"><a href="${jsn.url}" target="blank_"><span class="name">${jsn.name}</span></a></td>\n<td id="amountcell"><span class="amount">${jsn.amount}</span></td>\n<td id="pricecell"><span class="price">¥${jsn.price}</span></td>\n<td id="placecell"><span class="place">${jsn.place}</span></td>`;
    });
    
    var tr = document.createElement('tr');
    table.appendChild(tr);
    tr.innerHTML = '<td class="input"><input id="newname" placeholder="商品名を入力"><input id="newurl" placeholder="WebSiteのURL"></td><td class="input"><input id="newamount" type="number"></td><td class="input"><input id="newprice" type="number"></td><td class="input"><input id="newplace" placeholder="購入場所を入力"></td>';
}

function GetJson(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'materials.json', true);
    xhr.send(null);
    xhr.onload = () => {
        create_list(xhr.responseText);
    };
}

function RequestMaterial(){
    var xhr = new XMLHttpRequest();
    var table = document.getElementById("tbl");
    var nameval = document.getElementById("newname").value;
    var urlval = document.getElementById("newurl").value;
    var amountval = document.getElementById("newamount").value;
    var priceval = document.getElementById("newprice").value;
    var placeval = document.getElementById("newplace").value;
    
    if((nameval == "")||(urlval == "")||(amountval == "")||(priceval == "")||(placeval == "")){
        alert("入力内容に不備があります。");
        return;
    }

    xhr.open('POST', 'NewMaterial', true);
    xhr.send(`name^${nameval};url^${urlval};amount^${amountval};price^${priceval};place^${placeval}`);
    xhr.onload = () => {
        table.innerHTML = '<tr><th><p class="header">名前</p></th><th><p class="header">量</p></th><th><p class="header">価格</p></th><th><p class="header">場所</p></th></tr>';
        create_list(xhr.responseText);
    };
    coin.play();
}

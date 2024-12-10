// *** Блок объявления глобальных переменных ***
//параметры
var gTrump = ""; //козырь
var gJoker = "";
var gParamTrump = "";
var gDebug = false;
var gPlayers = 0; //количество игроков
var gProtagonist = 0; //номер игрока-человека
var gColod36 = ["6C", "6D", "6H", "6S", "7C", "7D", "7H", "7S", "8C", "8D", "8H", "8S", "9C", "9D", "9H", "9S", "TC", "TD", "TH", "TS", "JC", "JD", "JH", "JS", "QC", "QD", "QH", "QS", "KC", "KD", "KH", "KS", "AC", "AD", "AH", "AS"];
//флаги и счётчики
var gProtagonistTurn = false; //статус хода игрока-человека
var gCurrentRound = 0; //стартовый раунд, можно увеличивать, чтобы тестить игру в поздних режимах
var gCurrentPlayerTurn = 0; //номер игрока, который ходит в данный момент
var gTurnCount = 0; //счётчик количества игроков, положивших карту в данном ходу
var gVistChoice = 0; //счётчик количества игроков, сделавших выбор кол-ва взяток
//массивы текущих данных игроков и геймплея
var gResultTable  = []; //массив с текущим счётом игроков
var gPlayerCards = []; //массив будет хранить текущие карты всех игроков
var gTableCards = []; //массив, хранящий карты на столе
var gVists = []; //массив с текущими взятками игроков
var gRoundOrder = [];
var gHistory = [];

function doInit(){ //функция считывает параметры и формирует массивы с инфой о геймплее 
	gParamTrump = $("#param-trump").val(); 
	gTrump = gParamTrump; 
	gJoker = "7S";
	gDebug = document.getElementById("debug-mode").checked;
	gPlayers = $("#param-players").val(); 

	var vistArr = [0, 0];
	for (var i = 0; i < gPlayers; i++) {
		var vistObj = [].concat(vistArr);
		vistObj[0] = 0;
		vistObj[1] = 0;
		gVists.push(vistObj);
		gResultTable.push(0);
	}
	//составляем массив с последовательностью раундов согласно выбранным настройкам
	let roundArr =  ["normal", 0]; //для каждого раунда будут указаны тип игры и кол-во карт для раздачи
	let historyStr = new Array(gPlayers * 2).fill(0); //базовая строка в таблице истории, зависящая от количества игроков (на каждого по ячейке для взяток и ячейке для полученных очков)
	for (var i = 1; i < Math.floor(gColod36.length / gPlayers); i++){ //начало основной игры, кол-во раздаваемых карт возрастает
		var roundObj = [].concat(roundArr);
		roundObj[1] = i;
		gRoundOrder.push(roundObj);
		gHistory.push(Array.from(historyStr));
	}
	for (i = 1; i < gPlayers; i++){ //середина основной игры, раздаётся максимум карт столько раундов, сколько всего игроков
		var roundObj = [].concat(roundArr);
		roundObj[1] = Math.floor(gColod36.length / gPlayers);
		gRoundOrder.push(roundObj);
		gHistory.push(Array.from(historyStr));
	}
	for (i = Math.floor(gColod36.length / gPlayers); i > 0; i--){ //конец основной игры, кол-во раздаваемых карт уменьшается
		var roundObj = [].concat(roundArr);
		roundObj[1] = i;
		gRoundOrder.push(roundObj);
		gHistory.push(Array.from(historyStr));
	}
	if (document.getElementById("hide-flag").checked){ //тёмная, раздаётся максимум карт столько раундов, сколько всего игроков
		for (i = 0; i < gPlayers; i++){
			var roundObj = [].concat(roundArr);
			roundObj[0] = "hide";
			roundObj[1] = Math.floor(gColod36.length / gPlayers);
			gRoundOrder.push(roundObj);
			gHistory.push(Array.from(historyStr));
		}
	}
	if (document.getElementById("trumpless-flag").checked){ //бескозырка, раздаётся максимум карт столько раундов, сколько всего игроков
		for (i = 0; i < gPlayers; i++){
			var roundObj = [].concat(roundArr);
			roundObj[0] = "trumpless";
			roundObj[1] = Math.floor(gColod36.length / gPlayers);
			gRoundOrder.push(roundObj);
			gHistory.push(Array.from(historyStr));
		}
	}
	if (document.getElementById("miser-flag").checked){ //мизер, раздаётся максимум карт столько раундов, сколько всего игроков
		for (i = 0; i < gPlayers; i++){
			var roundObj = [].concat(roundArr);
			roundObj[0] = "miser";
			roundObj[1] = Math.floor(gColod36.length / gPlayers);
			gRoundOrder.push(roundObj);
			gHistory.push(Array.from(historyStr));
		}
	}
	if (document.getElementById("hide-flag").checked){ //золотая, раздаётся максимум карт столько раундов, сколько всего игроков
		for (i = 0; i < gPlayers; i++){
			var roundObj = [].concat(roundArr);
			roundObj[0] = "gold";
			roundObj[1] = Math.floor(gColod36.length / gPlayers);
			gRoundOrder.push(roundObj);
			gHistory.push(Array.from(historyStr));
		}
	}
	//создаём информационные табло игроков ИИ 
	for (var i = 1; i < gPlayers; i++) {
		var playerHTML = '<div class="other-player"><span class="other-player-name">Игрок ' + (i + 1) + ' (<span id="player' + i + '-vists">0</span>/<span id="player' + i + '-vists-needed">0</span>)</span><br/><span class="other-player-stats">Очки: <span id="player' + i + '-stats">0</span></span></div>';
		$("#players-list").append(playerHTML);
	}
		$(".modal-parent").css("display", "none"); //скрываем модальное окно с настройками
		$("#settings-block").css("display", "none");
		doNewRound();							   //и начинаем первый раунд
}

// *** Блок вспомогательных функций ***
Array.prototype.shuffle = function(b){ //перемешивание массива (колоды) случайным образом
	var i = this.length, j, t;
	while(i)	{
		j = Math.floor((i--) * Math.random());
		t = b && typeof this[i].shuffle !== "undefined" ? this[i].shuffle() : this[i];
		this[i] = this[j];
		this[j] = t;
	}
	return this;
};

//возвращает предположительную возможность взятие картой card взятки с учётом непредвиденных случайностей
function getCardsByPotential(card) {
	var potential = 0;
	var randomValue = Math.random();
	var coefPlayers = 3; //поправка на кол-во игроков, чем их больше, тем труднее брать взятки, исходным считаем три игрока
	if (card[1] === gTrump){ //для козырей
		if ((gColod36.indexOf(card) >= 20) && (gColod36.indexOf(card) < 32)) potential = 0.8; //лица
		else if (gColod36.indexOf(card) < 20) potential = 0.5; //числа
	}
	else if (gRoundOrder[gCurrentRound][0] === "trumpless"){ //для бескозырки отдельно посчитаем (надо бы учесть больше наборы лиц одной масти)
		if (gColod36.indexOf(card) >= 32) potential = 1; //тузы в бескозырке почти гарантированно берут
		else if ((gColod36.indexOf(card) >= 20) && (gColod36.indexOf(card) < 32)) potential = 0.5; //обыкновенные лица - средний
		else potential = 0.2; //мелочь иногда тоже может сыграть
	}
	else { //не козыри имеют более низкий потенциал
		if (gColod36.indexOf(card) >= 32) potential = 0.5; //тузы имеют средний потенциал
		else if ((gColod36.indexOf(card) >= 20) && (gColod36.indexOf(card) < 32)) potential = 0.2; //обыкновенные лица - низкий
		else potential = 0; //меньше вальта вообще в расчёт не берём, взять ими можно чисто случайно
	}
	potential = potential * (coefPlayers / gPlayers); 
  	if (randomValue <= potential) return 1;
  	else return 0; 
}

function getCardsByLear(lear){ //функция возвращает количество карт (learNumber) заданной масти (lear) 
	var learNumber = 0;
	var currentCards = gPlayerCards[gCurrentPlayerTurn];
	for (var i = 0; i < currentCards.length; i++) {
		if (currentCards[i].indexOf(lear) > 0) learNumber++;
	}
	return learNumber;
}

function getGrandCard(cards){ //функция возвращает cтаршую карту из переданного массива cards
	var grandCard = 0;
	if (cards.indexOf(gJoker) >= 0) return cards[cards.indexOf(gJoker)];
	for (var i = 1; i < cards.length; i++) {
		if (gColod36.indexOf(cards[i]) > gColod36.indexOf(cards[grandCard])) {
			if (!((cards[grandCard][1] === gTrump) && (cards[i][1] !== gTrump))) grandCard = i;
		}
		else {
			if ((cards[grandCard][1] !== gTrump) && (cards[i][1] === gTrump)) grandCard = i;	
		} 
	}	
	return cards[grandCard];	
}

function getJunCard(cards){ //функция возвращает младшую карту из переданного массива cards
	var junCard = 0;
	for (var i = 1; i < cards.length; i++) {
		if (gColod36.indexOf(cards[i]) < gColod36.indexOf(cards[junCard])) {
			if (!((cards[junCard][1] !== gTrump) && (cards[i][1] === gTrump))) junCard = i;
		}
		else {
			if ((cards[junCard][1] === gTrump) && (cards[i][1] !== gTrump)) junCard = i;	
		} 
	}	
	return cards[junCard];	
}

function getPossibility(cardType){ //функция проверяет можно ли положить данную карту (cardType) на стол и возвращает номер ситуации, если 0 - то нельзя
	if ((gTableCards.length === 0) || cardType == gJoker) { //если это первая карта на столе, то можно ложить любую, джокер тоже
		return 1;	
	}	
	else {
		var firstCard = document.getElementById("card1").getAttribute("card");
		if (firstCard == gJoker){ //для джокера пока предусмотрим "по наибольшей"
			if (cardType == getGrandCard(gPlayerCards[gCurrentPlayerTurn])) {
				return 2;		
			}	
			return 0;
		}
		else {
			firstCard = firstCard[1];
			var currCard = cardType[1];
			if (firstCard === currCard) { //если масти совпадают, то можно ложить
				return 3;		
			}
			if ((currCard === gTrump) && (getCardsByLear(firstCard) === 0)) { //козырь можно ложить, если масти по первой карте нет
				return 4;		
			}
			if ((getCardsByLear(gTrump) === 0) && (getCardsByLear(firstCard) === 0)) { //любую карту можно ложить, если нет масти по первой и козырей
				return 5;		
			}
			return 0;
		}
	}
}
//удаляет заданную карту текущего игрока после того, как он положил её на стол
function doRemoveCard(cardType){ 
	for (var i = 0; i < gPlayerCards[gCurrentPlayerTurn].length; i++){
		if (gPlayerCards[gCurrentPlayerTurn][i].indexOf(cardType) >= 0) {
			gPlayerCards[gCurrentPlayerTurn].splice(i, 1);
			return;
		}
	}
}
//отображает таблицу с историей матча
function viewHistory() {
	$(".modal-parent").css("display", "flex");
	$("#history-block").css("display", "block");
	var table = document.getElementById("history-table");
	let count = 0;

	table.innerHTML = "";

	//Создаём заголовки таблицы
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");

    //Первый столбец заголовка - "Раунд"
    var roundHeader = document.createElement("th");
    roundHeader.textContent = "Раунд";
    headerRow.appendChild(roundHeader);
    //Далее добавляем заголовки для каждого игрока (по два столбца на игрока)
    for (var i = 1; i <= gPlayers; i++) {
        var playerHeader = document.createElement("th");
        playerHeader.textContent = "Игрок " + i;
        playerHeader.colSpan = 2;
        headerRow.appendChild(playerHeader);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead); 

	gHistory.forEach(function(rowData) {
		var row = document.createElement("tr");
		//первая ячейка с номером раунда
		var indexCell = document.createElement("td");
		count++;
        indexCell.textContent = count;
        row.appendChild(indexCell);
        //дальше ячейки с результатами раунда
		rowData.forEach(function(cellData) {
			var cell = document.createElement("td");
			cell.textContent = (count - 1 <= gCurrentRound ? cellData : "");
			row.appendChild(cell);
		});
		if (count - 1 == gCurrentRound) {
			row.style.backgroundColor = "#399941";
		}
        table.appendChild(row);
    });
}
//функция задаёт параметры изображения (image) карты (card) и возвращает это изображения уже с нужными парметрами для карты на столе.
//а также вызывает удаление выложенной карты у игрока
function doCardOnTable(image, card){
	//немного адаптивности для отступов между картами на столе
	let screenWidth = window.innerWidth;
	let leftDist = (window.innerWidth > 600 ? 40 : 20 );
	let topDist= (window.innerWidth > 600 ? 20 : 15 );
	//формируем нужные свойства для карты на столе
	image.className = "table-card";
	image.id = "card" + gTurnCount;
	image.src = "img/" + card + ".png";
	//image.setAttribute("height", "200px");
	image.setAttribute("card", card);
	image.style.position = "absolute";
	image.style.left = (gTurnCount - 1)  * leftDist + "px";
	image.style.top = gTurnCount * topDist + "px";
	image.style.zIndex = 1 + gTurnCount;
	image.style.marginLeft = "2px";
	gTableCards.push(card);
	doRemoveCard(card);
	return image;
}

function getVistsImpossible(){ //функция возвращает кол-во взяток, которое нельзя заказать текущему игроку, если он будет ходить последним
	if (gVistChoice !== gPlayers - 1) return -1; //если сейчас выбирает взятки не последний ходящий игрок, то ограничений нет
	var sumVists = 0;
	for (var i = 0; i < gPlayers; i++){
		sumVists += gVists[i][1];
	}
	return gRoundOrder[gCurrentRound][1] - sumVists; //вычитаем из кол-ва выданных карт сумму заказанных взяток 
}

// *** Блок функций ИИ ***
function AI_getVists(){ //возвращает количество взяток, заказываемых ИИ. Надо бы сделать его более смелым, особенно при малом количестве карт на сдачу
	var result = 0;
	if (gRoundOrder[gCurrentRound][0] === "hide"){
		result = Math.floor(1 + Math.random() * (gRoundOrder[gCurrentRound][1] / 2 | 0 + 1)); //ИИ заказывает случайно от 1 до кол-ва карт делённого на 2 без остатка плюс 1
	}
	else {
		var haveJoker = false;
		var currentCards = gPlayerCards[gCurrentPlayerTurn];
		if (currentCards.indexOf(gJoker) >= 0) haveJoker = true;
		if (haveJoker && (getCardsByLear(gTrump) > 1)) {
			result = getCardsByLear(gTrump) + 1;
		}
		else {
			if (currentCards.indexOf("A" + gTrump) >= 0) result += 1;
			for (var i = 0; i < currentCards.length; i++) {
				if (currentCards[i] === gJoker) result++;
				else result += getCardsByPotential(currentCards[i]);
			}
		}
	}
	//если одну взятку нельзя заказать, то пусть пасует (для раундов с 1 картой актуально особенно), в других случаях берёт на 1 больше
	if (result === 1 && getVistsImpossible() === 1) result = 0;
	else if (result === getVistsImpossible()) result++;
	return result;
}

function AI_getCard(){ //возвращает номер карты игрока, которую положит ИИ. Пока выбираются случайным образом из возможных по правилам
	var result = 0;
	var currentCards = gPlayerCards[gCurrentPlayerTurn];
	var availableCards = [];
	for (var i = 0; i < currentCards.length; i++){ //формируем массив карт, которые мы вообще можем положить
		if (getPossibility(currentCards[i]) > 0) availableCards.push(currentCards[i]);
	}
	if ((gVists[gCurrentPlayerTurn][0] === gVists[gCurrentPlayerTurn][1] || gRoundOrder[gCurrentRound][0] === "miser") && gRoundOrder[gCurrentRound][0] !== "gold") { //если не нужно набирать взятки
		if (gTableCards.length === 0) return getJunCard(availableCards); //если игрок ложит карту первым за ход, то кидает минимальную, которой сложно что-то взять
		else return AI_getCard_stupid();
	}
	else { //если взятки ещё нужно брать, то ИИ будет это пытаться делать самой старшей картой
		return getGrandCard(availableCards);
	}
}

function AI_getVists_stupid(){ //возвращает количество взяток, заказываемых ИИ, пока без особого умысла - сейчас не используется
	var result = 0;
	if (gVistChoice !== gPlayers - 1) return Math.floor(Math.random() * (gRoundOrder[gCurrentRound][1] + 1));
	else do {
		result = Math.floor(Math.random() * (gRoundOrder[gCurrentRound][1] + 1));
	}
	while (getVistsImpossible() === result);
	return result;
}

function AI_getCard_stupid(){ //возвращает номер карты игрока, которую положит ИИ. Пока выбираются случайным образом из возможных по правилам
	var result = 0;
	var currentCards = gPlayerCards[gCurrentPlayerTurn];
	var max = currentCards.length;
	do {
		result = Math.floor(Math.random() * max);
	}
	while (getPossibility(currentCards[result]) === 0);
	return currentCards[result];
}

// *** Блок основных функций ***
function doDistribution(cardsNumb){ //раздача карт
	var currentColod = [].concat(gColod36); //копирование массива
	currentColod.shuffle(); //тасуем колоду
	var cardsWidth = parseFloat(getComputedStyle(document.getElementById("cards")).width) - 150 | 0;
	var cardMargin = "2px"
	if (148 * cardsNumb > cardsWidth) { //148 - текущая ширина карты с учётом отступов
		cardMargin = ((148 * cardsNumb - cardsWidth) / cardsNumb) | 0; //рассчитываем, на сколько px карта должна накрывать предыдущую, чтобы все они поместились
		document.getElementById("cards").style.paddingLeft = cardMargin + 5 + "px"; //паддинг слева, чтобы первая карта была без отступа
	}
	if (gRoundOrder[gCurrentRound][0] === "trumpless") { //Для бескозырки назначаем козырем несуществующую масть
		gTrump = "N";
	}
	else if (gParamTrump === "R") { //если козырь по настройкам рандомный, то случайно назначаем его при раздаче
		gTrump = "DCHS"[Math.floor(Math.random() * "DCHS".length)];
	}
	else { //в остальных случаях (статический козырь) прямо назначаем козырь согласно настройкам
		gTrump = gParamTrump;
	}
	for (var i = 0; i < cardsNumb; i++) {
		for (var j = 0; j < gPlayers; j++) {
			currCard = currentColod.pop();
			gPlayerCards[j].push(currCard);
			if (j === gProtagonist){
				var tempImage = new Image();
				tempImage.className = "player-card";
				if (gRoundOrder[gCurrentRound][0] === "hide"){ //если текущий раунд играем в тёмную, то не показываем игроку его карты
					tempImage.src = "img/back.png";
					tempImage.setAttribute("card", "hide");
				}
				else {
					tempImage.src = "img/" + currCard + ".png";
					tempImage.setAttribute("card", currCard);
				}
				tempImage.setAttribute("height", "200px");
				tempImage.style.position = "relative";
				tempImage.style.display = "inline-block"; //для того, чтобы на карты действовало св-во блока white-space: nowrap и они не переносились на новую строку
				tempImage.style.zIndex = 1 + i;
				tempImage.style.marginLeft = "-" + cardMargin + "px";
				document.getElementById("cards").appendChild(tempImage);
			}
		}	
	}
	$(".player-card").on("click", function(e) { //навешиваем на карты игрока-человека события, чтобы он мог ложить карту по клику на неё
		currentCard = this;
		if (gProtagonistTurn && (getPossibility(currentCard.getAttribute("card")) > 0)) {
	  		$(".table-card").unbind("click");
			document.getElementById("card-place").appendChild(doCardOnTable(currentCard, currentCard.getAttribute("card")));
			gProtagonistTurn = false;
			if (gCurrentPlayerTurn >= gPlayers - 1) gCurrentPlayerTurn = 0;
			else gCurrentPlayerTurn++;
			if (gTurnCount < gPlayers) doTurn();
			else doTurnEnd();
		}
	});
}

function doTurn(){ //функция разрешает ходить игроку-человеку или осуществляет ход АИ
	gTurnCount++;
	if (gCurrentPlayerTurn == gProtagonist) { //если gProtagonistTurn, игрок может ходить 
		gProtagonistTurn = true;
		document.getElementById("player-turn-tooltip").style.display = "block";
	}
	else { //ход ИИ
		var currentCards = gPlayerCards[gCurrentPlayerTurn];
		var tempImage = new Image();
		var ai_card = AI_getCard();
		document.getElementById("card-place").appendChild(doCardOnTable(tempImage, ai_card));
		if (gCurrentPlayerTurn >= gPlayers - 1) gCurrentPlayerTurn = 0;
		else gCurrentPlayerTurn++;
		if (gTurnCount < gPlayers) doTurn();
		else doTurnEnd();
	}
	return;	
}

//в функции подсчитывается, кто выиграл взятку за данный ход, а для последнего хода рассчитывает также результат раунда
function doTurnEnd(){
	var tableCards = [];	
	tableCards.push(gTableCards[0]);
	var playerOrder = [];
	for (var i = 1; i < gPlayers; i++){ //составляем массив из выложенных карт на столе
		if ((gTableCards[i][1] == tableCards[0][1]) || (gTableCards[i][1] == gTrump) || (gTableCards[i] == gJoker)) {	//заносим только карты по первой масти, козыри и джокера
			tableCards.push(gTableCards[i]);
		}
		else tableCards.push("00"); //остальные карты значения в расчёте не имеют, ставим заглушку
	}
	for (i = 0; i < gPlayers; i++) { //список игроков
		playerOrder.push(i);
	}
	for (i = 0; i < gPlayers; i++) { //сдвинем список игроков в зависимости от того, кто первым (gCurrentPlayerTurn) ходил здесь
		if (playerOrder[0] != gCurrentPlayerTurn) {
			playerOrder.push(playerOrder.shift()); //циклический сдвиг влево
		}
	}
	var winner = 0; //сначала будем считать, что победил тот, кто первым ходил
	var grandCard = getGrandCard(tableCards);
	for (i = 0; i < gPlayers; i++){
		if (tableCards[i] == grandCard) {
			winner = i;
			break;
		}
	}
	gCurrentPlayerTurn = playerOrder[winner]; //преобразуем в фиксированный номер игрока, а не по порядку хода в данный момент, победитель будет ходить следующим 
	gVists[gCurrentPlayerTurn][0]++;
	$("#player" + gCurrentPlayerTurn + "-vists").text(gVists[gCurrentPlayerTurn][0]);
	document.getElementById("player-turn-tooltip").style.display = "none";
	if (gPlayerCards[0].length != 0) document.getElementById("next-turn").style.display = "block"; //кнопка для перехода к следующему ходу
	else { //иначе активируем кнопку окончания раунда и выводим результат, здесь нужно для того, чтобы результаты последнего хода и всего раунда можно было посмотреть
		//подведение итогов раунда
		let vistDiff = 0;
		let roundResult = 0;
		for (var i = 0; i < gPlayers; i++){
			if (gRoundOrder[gCurrentRound][0] === "gold") { //на голде просто даём очки за каждую взятку
				roundResult = gVists[i][0] * 10;
			} 
			if (gRoundOrder[gCurrentRound][0] === "miser") { //на мизере отнимаем очки за каждую взятку и даём бонус тем, кто не взял ничего
				roundResult = gVists[i][0] * (-10);
				if (gVists[i][0] == 0) roundResult = 50;
			} 
			else {	
				vistDiff = gVists[i][0] - gVists[i][1]; //разница между взятыми и заказанными взятками
				if (vistDiff === 0) {
					if (gVists[i][1] === 0) roundResult = 5; //если игрок пасовал
					else roundResult = gVists[i][1] * 10;
				}
				else if (vistDiff > 0) roundResult = gVists[i][0];
				else roundResult = vistDiff * 10;
			}
			gResultTable[i] += roundResult;
			gHistory[gCurrentRound][i*2 + 1] = roundResult;
			$("#player" + i + "-stats").text(gResultTable[i]); 
		}
		document.getElementById("end-round").style.display = "block"; 
	} 
}

function doNextTurn(){ //событие по клику кнопки "Следующий ход", подготовка и переход к следующему ходу
	document.getElementById("next-turn").style.display = "none";
	$(".table-card").remove(); //очищаем стол от карт предыдущего хода
	while (gTableCards.length != 0) gTableCards.pop();
	gTurnCount = 0; 
	if (gDebug) { //выводим карты ИИ для более наглядного тестирования
		for (var i = 1; i < gPlayers; i++) { 
			document.getElementById("ai-test" + i).innerText = gPlayerCards[i];
		}
	}
	doTurn();
}

function doRoundEnd(){ //очистка карт игроков, запуск следующего раунда
	document.getElementById("end-round").style.display = "none";
	$(".other-player-first").toggleClass("other-player-first", false);
	$(".table-card").remove(); //очищаем стол от карт предыдущего хода
	while (gTableCards.length != 0) gTableCards.pop();
	while (gPlayerCards.length != 0) gPlayerCards.pop();
	gCurrentRound++;
	if (gCurrentRound < gRoundOrder.length) doNewRound();
	else doEndGame();
}

function doNewRound(){
	$("#current-round").text(gCurrentRound + 1);
	if (gRoundOrder[gCurrentRound][0] === "gold") {
		$("#round-type").text(" (золот.)");
	} else if (gRoundOrder[gCurrentRound][0] === "miser") {
		$("#round-type").text(" (мизер)");	
	} else if (gRoundOrder[gCurrentRound][0] === "hide") {
		$("#round-type").text(" (тёмн.)");
	} else if (gRoundOrder[gCurrentRound][0] === "trumpless") {
		$("#round-type").text(" (бескоз.)");
	} else if (gRoundOrder[gCurrentRound][0] === "normal") {
		$("#round-type").text(" (обычн.)");
	} else {
		$("#round-type").text(" (неизв.)");
	}
	gCurrentPlayerTurn = gCurrentRound % gPlayers; //рассчитываем ходящего первым игрока из номера раунда и кол-ва игроков
	if (gCurrentPlayerTurn !== gProtagonist) $(".other-player").eq(gCurrentPlayerTurn - 1).toggleClass("other-player-first", true); //отмечаем красной рамкой ИИ-игрока, который ходит первым в этом раунде
	for (var i = 0; i < gPlayers; i++) {
		gPlayerCards.push([]);
		gVists[i][0] = 0;
		gVists[i][1] = 0;
		$("#player" + i + "-vists").text("0");
		$("#player" + i + "-vists-needed").text("0");
	}
	var vistSel = document.getElementById("player-vists");
	for (var i = vistSel.options.length - 1; i >= 0; i--){ //очищаем список выбора взяток игрока
    	vistSel.remove(i);
  	}

	doDistribution(gRoundOrder[gCurrentRound][1]); //раздача карт

	if (gRoundOrder[gCurrentRound][0] === "trumpless") {
		$("#current-trump").text("нет");
	} else {
		var trumpSel = document.getElementById("param-trump").options;
		for (i = 0; i < trumpSel.length; i++){ //выводим название текущего козыря, найдя его в списке из настроек
			if (trumpSel[i].value === gTrump) $("#current-trump").text(trumpSel[i].text);
		}
	}
	
	gVistChoice = 0;
	doVistChoice(); //запускаем рекурсивную функцию заказа взяток для человека и ИИ
	if (gDebug) { //выводим карты ИИ для более наглядного тестирования
		for (var i = 1; i < gPlayers; i++) { 
			document.getElementById("ai-test" + i).innerText = gPlayerCards[i];
		}
	}
}

function doPlayerChoice(){
	if (gRoundOrder[gCurrentRound][0] === "gold" || gRoundOrder[gCurrentRound][0] === "miser") { //на голде с мизером взятки не заказываются
		gVists[gCurrentPlayerTurn][1] = 0;
	} else {
		gVists[gCurrentPlayerTurn][1] = parseInt(document.getElementById("player-vists").value);
		gHistory[gCurrentRound][gProtagonist*2] = gVists[gCurrentPlayerTurn][1];
		document.getElementById("vists-choice").style.display = "none";
	}
	$("#player" + gCurrentPlayerTurn + "-vists-needed").text(gVists[gCurrentPlayerTurn][1]);
	gCurrentPlayerTurn++;
	gVistChoice++;
	if (gCurrentPlayerTurn > gPlayers - 1) gCurrentPlayerTurn = 0;
	doVistChoice();
}

function doVistChoice(){
	if (gVistChoice < gPlayers){
		if (gCurrentPlayerTurn == gProtagonist) {
			if (gRoundOrder[gCurrentRound][0] === "gold" || gRoundOrder[gCurrentRound][0] === "miser"){
				doPlayerChoice();
			}
			else {	
				var vistSel = document.getElementById("player-vists");
				var vistsImpossible = getVistsImpossible(); //если игрок выбирает последним, может быть ограничение на взятки
				var j = 0;
				for (var i = 0; i <= gRoundOrder[gCurrentRound][1]; i++){
					if ((i === 0) && (gRoundOrder[gCurrentRound][0] === "hide")) continue; //при игре в тёмную нельзя пасовать
					if (i !== vistsImpossible) {
						vistSel.options[j] = new Option(i, i); //когда ограничения нет, vistsImpossible отрицательна и всегда не равна i 
						j++;
					}
				}
				document.getElementById("vists-choice").style.display = "block";
			} 
		}
		else {
			if (gRoundOrder[gCurrentRound][0] === "gold" || gRoundOrder[gCurrentRound][0] === "miser"){
				gVists[gCurrentPlayerTurn][1] = 0;
			} else {
				gVists[gCurrentPlayerTurn][1] = AI_getVists();
				gHistory[gCurrentRound][gCurrentPlayerTurn*2] = gVists[gCurrentPlayerTurn][1];
			}
			$("#player" + gCurrentPlayerTurn + "-vists-needed").text(gVists[gCurrentPlayerTurn][1]);
			gCurrentPlayerTurn++;
			gVistChoice++;
			if (gCurrentPlayerTurn > gPlayers - 1) gCurrentPlayerTurn = 0;
			doVistChoice();
		}
	}
	else { //когда все игроки заказали свои взятки
		if (gRoundOrder[gCurrentRound][0] === "hide"){ //раскрываем карты игрока-человека, если игра в тёмную
			var hideCards = document.querySelectorAll(".player-card");
			for (i = 0; i < hideCards.length; i++){
				hideCards[i].src = "img/" + gPlayerCards[gProtagonist][i] + ".png";
				hideCards[i].setAttribute("card", gPlayerCards[gProtagonist][i]);
			}
		}
		gTurnCount = 0; 
		doTurn(); //первый ход в раунде
	}
}

function doEndGame(){
	var maxResult = gResultTable[0];
	var winners = [];
	for (var i = 1; i < gPlayers; i++){ //находим максимальный результат
		if (gResultTable[i] > maxResult) maxResult = gResultTable[i];
	}
	for (i = 0; i < gPlayers; i++){ //победителей может быть несколько, всех их заносим в массив победителей
		if (gResultTable[i] == maxResult) winners.push(i);
	}
	if (winners.length == 1) alert("Победитель: Игрок " + (winners[0] + 1));
	else alert("Победителей несколько");
}


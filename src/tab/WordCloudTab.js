/**
 * Created by Andrey Klochkov on 04.03.15.
 */

function WordCloudTab(pageNum){
    this.pageNum = pageNum;
    this.clouds = [];
}

WordCloudTab.wordSort = function(a, b){
    if (parseInt(a.Len) < parseInt(b.Len))
        return -1;
    if (parseInt(a.Len) > parseInt(b.Len))
        return 1;
    return 0;
};

WordCloudTab.prototype.exportToCsv = function(bookData){
    var cloudData = this.clouds;
    var x = new Array(cloudData.length + 1);

    for (var i = 0; i < cloudData.length + 1; i++) {
        x[i] = new Array(2);
    }

    x[0][0] = "Words";
    x[0][1] = "Count";

    var nArrayIndex = 1;
    for(var index = cloudData.length-1; index >= 0 ; index --) {
        x[nArrayIndex][0] = cloudData[index].Word;
        x[nArrayIndex][1] = cloudData[index].Len.toString();
        nArrayIndex++;
    }

    var csvContent = "data:text/csv;charset=utf-8,";
    x.forEach(function(infoArray, index){
        var dataString = [];
        for (var i = 0; i < infoArray.length; i++)
        {
            var quotesRequired = false;
            if (infoArray[i].indexOf(",") >= 0)
                quotesRequired = true;
            var escapeQuotes = false;
            if (infoArray[i].indexOf("\"") >= 0)
                escapeQuotes = true;

            var fieldValue = (escapeQuotes ? infoArray[i].replace("\"", "\"\"") : infoArray[i]);

            if (fieldValue.indexOf("\r") >= 0 || fieldValue.indexOf("\n") >= 0)
            {
                quotesRequired = true;
                fieldValue = fieldValue.replace("\r\n", "");
                fieldValue = fieldValue.replace("\r", "");
                fieldValue = fieldValue.replace("\n", "");
            }

            dataString[i] = (quotesRequired || escapeQuotes ? "\"" : "") + fieldValue + (quotesRequired || escapeQuotes ? "\"" : "") + ((i < (infoArray.length-1)) ? "," : "\r\n");
        }

        for (var i = 0; i < dataString.length; i ++)
            csvContent += dataString[i];
    });

    var encodedUri = encodeURI(csvContent);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wc-"+Helper.getCategoryFromBookData(bookData)+"-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
};

WordCloudTab.prototype.shuffle = function(array) {
    var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

/**
 * Word cloud HTML generator - created by Jang
 * @returns {{info: string, content: string, words: string}}
 */
WordCloudTab.prototype.load = function(){
    var xPathRes = document.evaluate ( "/html/body/div/div/div/div/table/tbody/tr/td[2]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var InnerTexts = "";

    if (xPathRes.length < 1)
        return;

    for (var i = 0; i < xPathRes.snapshotLength; i++) {
        if (i > this.pageNum * 20)
            break;

        InnerTexts += xPathRes.snapshotItem (i).innerText + " ";
    }

    InnerTexts = InnerTexts.toLowerCase();

    InnerTexts = InnerTexts.replace(/ the /g, ' ');
    InnerTexts = InnerTexts.replace(/the /g, ' ');
    InnerTexts = InnerTexts.replace(/ a /g, ' ');
    InnerTexts = InnerTexts.replace(/ of /g, ' ');
    InnerTexts = InnerTexts.replace(/ i /g, ' ');
    InnerTexts = InnerTexts.replace(/ and /g, ' ');
    InnerTexts = InnerTexts.replace(/ in /g, ' ');
    InnerTexts = InnerTexts.replace(/ at /g, ' ');
    InnerTexts = InnerTexts.replace(/-/g, ' ');
    InnerTexts = InnerTexts.replace(/\d+/g, ' ');
    InnerTexts = InnerTexts.replace(/ and /g, ' ');
    InnerTexts = InnerTexts.replace(/ to /g, ' ');
    InnerTexts = InnerTexts.replace(/to /g, ' ');
    InnerTexts = InnerTexts.replace(/:/g, ' ');
    InnerTexts = InnerTexts.replace(/ at /g, ' ');
    InnerTexts = InnerTexts.replace(/at /g, ' ');
    InnerTexts = InnerTexts.replace(/ for /g, ' ');
    InnerTexts = InnerTexts.replace(/we /g, ' ');
    InnerTexts = InnerTexts.replace(/you /g, ' ');
    InnerTexts = InnerTexts.replace(/me /g, ' ');
    InnerTexts = InnerTexts.replace(/'/g, ' ');
    InnerTexts = InnerTexts.replace(/ our /g, ' ');
    InnerTexts = InnerTexts.replace(/,/g, ' ');
    InnerTexts = InnerTexts.replace(/will /g, ' ');
    InnerTexts = InnerTexts.replace(/ will /g, ' ');
    InnerTexts = InnerTexts.replace(/[()]/g, ' ');
    InnerTexts = InnerTexts.replace(/[{}]/g, ' ');
    InnerTexts = InnerTexts.replace(/\[/g, ' ');
    InnerTexts = InnerTexts.replace(/\]/g, ' ');
    InnerTexts = InnerTexts.replace(/&/g, ' ');
    InnerTexts = InnerTexts.replace(/\//g, ' ');
    InnerTexts = InnerTexts.replace(/!/g, ' ');

    var words = InnerTexts.split(" ");

    this.clouds = [];

    for (var i = 0; i < words.length; i++)
    {
        if ((typeof words[i] === "undefined") || (words[i].length < 1))
            continue;

        var found = false;
        for(var j = 0; j < this.clouds.length; j++) {
            if (this.clouds[j].Word == words[i]) {
                found = true;
                break;
            }
        }

        if (!found)
        {
            var nDuplicateCnt = 0;
            for (var n = 0; n < words.length; n++)
            {
                if (words[i] === words[n])
                    nDuplicateCnt++;
            }

            this.clouds.push({"Len":nDuplicateCnt, "Word": words[i]});
        }
    }

    this.clouds.sort(WordCloudTab.wordSort);

    var infoHtml = "<div style=\"font-size:11px;color:#a8a8a8;padding-top: 1px\">" + "Showing top 50 of " + (this.clouds.length - 1) + " possible words:</div>";

    var level = [];

    var nlevelIndex = 0;
    for (var i = this.clouds.length - 1; i >= 0; i--)
    {
        var found = false;
        for(var j = 0; j < this.clouds.length; j++) {
            if (this.clouds[j].Len == level[i]) {
                found = true;
                break;
            }
        }

        if (!found)
        {
            if (this.clouds[i].Word.length > 2)
            {
                level[nlevelIndex] = this.clouds[i].Len;
                nlevelIndex++;
            }
        }

        if (nlevelIndex >= 6)
            break;
    }

    var cloudLevel = 1;
    var contentHtml = "";
    var nCnt = 0;

    var shuffleArray = [];

    for (var i = this.clouds.length - 1; i >= 0; i--)
    {
        cloudLevel = 6;
        for (var j = 0; j < level.length; j++)
        {
            if (this.clouds[i].Len === level[j])
            {
                cloudLevel = j + 1;
                break;
            }
        }

        if (this.clouds[i].Word.length > 2)
        {
            if (this.clouds[i].Len < 2)
                shuffleArray.push({Level:6, Word:this.clouds[i].Word, Len:this.clouds[i].Len});
            else
                shuffleArray.push({Level:cloudLevel, Word:this.clouds[i].Word, Len:this.clouds[i].Len});
        }

        if (nCnt >= 50)
            break;

        nCnt++;
    }

    shuffleArray = this.shuffle(shuffleArray);

    for (var i = 0; i < shuffleArray.length; i++)
    {
        contentHtml += "<span class=\"occurcnt\"><span class=\"best" + shuffleArray[i].Level + "\">" + "&nbsp;" + shuffleArray[i].Word + "</span>(" + shuffleArray[i].Len + ")&nbsp;</span>";
    }

    var wordsHtml = "";
    nCnt = 1;
    for (var i = this.clouds.length - 1; i >= 0; i--)
    {
        if (this.clouds[i].Word.length > 2)
        {
            wordsHtml += (nCnt + ". <b style='padding-right : 15px;'>" + this.clouds[i].Word + "</b>&nbsp;&nbsp;&nbsp;&nbsp;");
            if (nCnt >= 5)
                break;

            nCnt++;
        }
    }

    return {info: infoHtml, content: contentHtml, words: wordsHtml};
};

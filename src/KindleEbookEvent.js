/**
 * Created by Jang on 4/28/14.
 */

var ParentUrl;
var SiteParser;

$(window).ready(function () {
    var Url = location.href;
    ParentUrl = Url;
    SiteParser = GetSiteParser(Url);
    if (ParentUrl.indexOf("/ref=") >= 0)
    {
        var _Pos = Url.lastIndexOf('/');
        ParentUrl = Url.substr(0, _Pos);
    }

    if (Url.indexOf(SiteParser.MainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0)
        return;

    $("#nav-searchbar").submit(function()
    {
        chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false});
        chrome.runtime.sendMessage({type: "remove-settings", ParentUrl: ParentUrl});
        setTimeout("processWhenDone()", 1500);
    });

    if (IsAuthorPage()){
        scrapeAuthorPage(Url);
    }

    else if (IsSearchPage(Url)) {
        scrapeSearchPage(Url);
    }

    else if (IsBestSellersPage(Url)){
        scrapeBestSellersPage(Url);
    }
});

function IsAuthorPage(){
    return document.documentElement.innerHTML.indexOf(SiteParser.AreYouAnAuthorPattern) >= 0;
}

function IsSearchPage(Url){
    return Url.indexOf(SiteParser.MainUrl +"/s/")==0 && Url.indexOf("digital-text") > 0;
}

function IsBestSellersPage(Url){
    return (Url.indexOf(SiteParser.MainUrl +"/Best-Sellers-Kindle-Store") >= 0 && Url.indexOf("digital-text") > 0)
        || (Url.indexOf(SiteParser.MainUrl +"/gp/bestsellers") >= 0 && Url.indexOf("digital-text") > 0);
}

function ParseString(responseText, pattern, startchar, endchar)
{
    var pos = responseText.indexOf(pattern);
    if (pos < 0)
        return "";

    var str = responseText.substr(pos + pattern.length);

    pos = str.indexOf(startchar);

    if (pos < 0)
        return "";

    str = str.substr(pos + startchar.length);

    pos = str.indexOf(endchar);

    if (pos < 0)
        return "";

    return str.substr(0, pos).trim();
}

function GetNoInfo(responseText)
{
    return ParseString(responseText, 'class="zg_rankNumber"', ">", ".");
}

function GetPriceInfo(responseText)
{
    return ParseString(responseText,'class="price"', ">", "<");
}

function GetPageUrl(responsneText)
{
    return ParseString(responsneText, 'class="zg_title"', 'href="', '"');
}

function GetReviewrInfo(responseText)
{
    var pattern = "a href";
    var str = responseText;
    var pos = str.indexOf(pattern);

    var review = "";

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        review = ParseString(str, "product-reviews", '>', '<');
        if (typeof review !== "undefined" && review.length > 0)
            return review;

        pos = str.indexOf(pattern);
    }

    return "0";
}

function GetCategoryInfo(responseText)
{
    return ParseString(responseText, 'class="category"', '>', '<');
}

function ParseBestSellersPage(responseText, parentUrl, IsFree)
{
    var pattern = 'class="zg_itemImmersion"';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var index = 0;
    var bIsExist = [];
    category = GetCategoryInfo(str).trim();

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        No[index] = GetNoInfo(str);
        url[index] = GetPageUrl(str);
        price[index] = GetPriceInfo(str);
        review[index] = GetReviewrInfo(str);

        pos = str.indexOf(pattern);
        index++;
    }

    chrome.runtime.sendMessage({type:"get-settings"}, function(response){
        for (var i = 0; i < url.length; i++)
        {
            if (typeof url[i] === "undefined" || url[i].length < 1)
                continue;
            if (response.settings.PullStatus)
                setTimeout(fRun.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Seller"), 500*i); //continue to try other sizes after 0.5 sec
        }
    });
}

function LoadBestSellersUrl(url, parentUrl, IsFree)
{
    $.get(url, function(responseText){
        setTimeout(ParseBestSellersPage.bind(null, responseText, parentUrl, IsFree), 1000);
    });
}

function GetAuthorPageUrl(responseText)
{
    if(responseText.length<0) return "";
    var urls = responseText.match(/<a href=\"(.*)\".*><span .*>Kindle Edition<\/span>/);
    if(urls!=null) return urls[1];

    return ParseString(responseText, 'class="title"', 'href="', '">');
}	

function GetAuthorPrice(responseText)
{
    var str = responseText;
    var pos = 0;

    var strSplit = str.split("<tr class>");
    var bFind = false;
    for (var i = 0; i < strSplit.length; i++)
    {
        if (strSplit[i].toLowerCase().trim().indexOf("kindle edition") >= 0)
        {
            pos = strSplit[i].toLowerCase().trim().indexOf("kindle edition");

            str = strSplit[i].substr(pos);

            bFind = true;
            break;
        }
    }

    if (!bFind)
        return "0";

    pos = str.indexOf('$');

    while (pos >= 0)
    {
        str = str.substr(pos + 1);
        var _pos = str.indexOf('<');

        if (_pos >= 0)
        {
            var price = str.substr(0, _pos).trim();
            if (typeof price !== "undefined" && price.indexOf("0.00") < 0)
                return "$" + price;
        }

        pos = str.indexOf('$');
    }

    return "0";

}

function GetAuthorReview(responseText)
{
    return ParseString(responseText,'reviewsCount">', '">', '<');
}

function GetAuthorCategory(responseText)
{
    return ParseString(responseText, 'EntityName', '<b>', '</b>');
}

function ParseAuthorPage(startIndex, maxResults, responseText, parentUrl)
{
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var counter = 0;
    var index = 0;

    $(responseText).find(".results").children().each(function() {
        if(this.id == "result_"+(startIndex+counter)) {
            if(counter>=maxResults) return;
            var krow = SiteParser.GetKindleEditionRow($(this));
            No[index] = parseInt(index) + 1 + parseInt(startIndex);
            if(typeof krow == "undefined"){
                counter++;
                return;
            }

            url[index] = SiteParser.GetUrlFromKindleEditionRow(krow);
            review[index] = SiteParser.GetReviewsCountFromResult($(this));
            if(!review[index]) review[index] = 0;
		    var kprice = SiteParser.GetPriceFromKindleEditionRow(krow);
		    if(kprice.length<1) {
			    kprice = $(krow).find(".toePrice a#buyPrice:first");
	    	}
	    	price[index] = $(kprice).text().trim();
            url[index] = url[index].replace("&amp;", "&");
            url[index] = url[index].replace(" ", "%20");
            counter++;
            index++;
        }
    });
    if(counter == 0) return undefined;

    category = GetAuthorCategory(responseText).trim();

    if (typeof category === "undefined" || category.length < 1)
    {
        category = ParseString(responseText, 'entityHeader', '>', '<');
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }

    chrome.runtime.sendMessage({type:"get-settings"}, function(response){
        for (var i = 0; i < url.length; i++)
        {
            if (typeof url[i] === "undefined" || url[i].length < 1)
                 continue;

            if (typeof price[i] === "undefined" || price[i].length < 1)
                continue;

            if (response.settings.PullStatus)
            {
                setTimeout(fRun.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Author"), 500*i); //continue to try other sizes after 0.5 sec
            }
        }
    });

    return index;
}

function LoadAuthorPage(url, parentUrl, startIndex, maxResults)
{
    $.get(url, function(responseText){
        return ParseAuthorPage.bind(null, startIndex, maxResults, responseText, parentUrl);
    });
}

function ParseSearchPage(startIndex, endIndex, responseText, parentUrl, search)
{
    var pattern = 'id="result_';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category=search;

    var strResult;
    var nParagraph = 0;

    var index = 0;
    var bIsExist = [];
    var result;

    $(responseText).find(".results").each(function() {
	    while( (result = $(this).find("#result_"+(startIndex+index))).length>0 ) {
		    if(startIndex + index>=endIndex) break;
		    No[index] = startIndex + index + 1;
		    url[index] = $(result).find(".newaps a:first").attr("href");
		    if(!url[index]) url[index] = "";
		    var kprice = $(result).find(".red.bld");
		    price[index] = $(kprice).length>0? $(kprice).first().text().trim():SiteParser.CurrencySign + "0.00";
		    review[index] = undefined; 

		    url[index] = url[index].replace("&amp;", "&");
		    url[index] = url[index].replace(" ", "%20");
		    index++;
	    }
    });

    if(index<1) return;


    if (typeof category === undefined /*|| category.length < 1*/)
    {
        category = ParseString(responseText, 'entityHeader', '>', '<');
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }


    chrome.runtime.sendMessage({type:"get-settings"}, function(response){
        for (var i = 0; i < url.length; i++)
        {
            if (typeof url[i] === "undefined" || url[i].length < 1)
                 continue;

            if (typeof price[i] === "undefined" || price[i].length < 1)
                continue;

	    var purl = location.href;
    	    purl = purl.replace(/\&page=[0-9]+/, "");	    

            if (response.settings.PullStatus && parentUrl === purl)
            {
                setTimeout(fRun.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Search"), 500*i); //continue to try other sizes after 0.5 sec
            }
        }
    });

    return;
}


function LoadSearchPage(url, parentUrl, startIndex, endIndex, search)
{
    $.get(url, function(responseText){
        setTimeout(ParseSearchPage.bind(null, startIndex, endIndex, responseText, parentUrl, search), 1000);
    });
}

function scrapeAuthorPage(Url){
    $.get(Url, function(responseText){
        if (responseText.indexOf(SiteParser.AreYouAnAuthorPattern) >= 0)
        {
            chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

            LoadAuthorResultPage(function(){
                LoadAuthorResultPage();
            });
        }
    });
}

function scrapeSearchPage(Url) {

	var Url = location.href;
	ParentUrl = Url;

	if (ParentUrl.indexOf("/s/") < 0) return;

	ParentUrl = Url.replace(/\&page=[0-9]*/i, "");

	chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

	var search = GetParameterByName(Url, "field-keywords");

    $.get(ParentUrl, function(responseText){
        for (var i = 1; i <= 2; i++) {
            LoadSearchResultsPage(i, 3000 * i)
        }
    });
}

function scrapeBestSellersPage(Url){
    $.get(Url, function(responseText){
        if (responseText.indexOf("Kindle-Store-eBooks/") >= 0
            || (Url.indexOf(SiteParser.MainUrl + "/" + SiteParser.BestSellersUrl) >= 0
            && Url.indexOf("/digital-text/") >=0 ))
        {
            if (Url.indexOf("ref=zg_bs_fvp_p_f") < 0 && Url.indexOf("&tf=") < 0)
            {
                chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: true});
            }

            ParseBestSellersPage(responseText, ParentUrl, false);
            for (var i = 2; i <= 2; i++)
            {
                LoadBestSellersPage(i, 3000*i);
            }
        }
    });
}

function processWhenDone() {
	var search = GetParameterByName(location.href, "field-keywords");
	if(search.trim()=="" || $("#bcKwText").text() !== '"'+search+'"' || 
		$("#bcKwText").css("visibility")!= "visible")
		setTimeout("processWhenDone()", 500);
	else {
		var Url = location.href;
		ParentUrl = Url;
		if (ParentUrl.indexOf("/s/") >= 0)
		{
			var _Pos = Url.lastIndexOf('/');
			ParentUrl = Url.replace(/\&page=[0-9]+/, "");
		}

		scrapeSearchPage(Url);
	}
}

function GetSalesRank(responseText)
{
    if (typeof responseText !== "undefined" && responseText.length > 1)
    {
        var szPattern = SiteParser.AmazonBestSellersPattern;
        var pos = responseText.indexOf(szPattern);

        if (typeof pos === "undefined" || pos < 0)
            return "0";

        var szSalesRank = responseText.substr(pos + szPattern.length);
        szPattern = '>';
        pos = szSalesRank.indexOf(szPattern);

        if (typeof pos === "undefined" || pos < 0)
            return "0";

        var szSalesRank = szSalesRank.substr(pos + szPattern.length);
        szSalesRank = szSalesRank.trim();
        var szTmp = szSalesRank.split(" ");
        for (var i = 0; i < szTmp.length; i++)
        {
            if (szTmp[i].indexOf('#') >= 0)
            {
                szSalesRank = szTmp[i].substr(szTmp[i].indexOf('#') + 1);
                return szSalesRank;
            }
        }

        return "0";
    }

    return "0";
}

function GetTitle(responseText)
{
    if (typeof responseText !== "undefined" && responseText.length > 1)
    {
        return SiteParser.GetTitle(responseText);
    }
}

function GetAuthorTitle(responseText)
{
    return ParseString(responseText, 'id="productTitle"', '>', '<');
}

function GetAuthor(responseText)
{
    var tmpResponseText = ParseString(responseText, 'contributorNameTrigger', '>', '/a>');
    var author = ParseString(tmpResponseText, 'contributorNameTrigger', '>', '<');
    if ((author == '')||(author == 'undefined')){
        tmpResponseText = ParseString(responseText, "<div class=\"buying\">", 'parseasinTitle', "<span class=\"byLinePipe\">");
        author = ParseString(tmpResponseText , "<a", '>', '</a>');
    }
    return author;
}

function GetDateOfPublication(responseText, callback)
{
    var pubdate = $(responseText).find('#pubdate').val();

    $.ajax({
        url: "/gp/product/features/ebook-synopsis/formatDate.html",
        data: { datetime: pubdate },
        dataType: "json",
        success: function (responseJson) {
            var dateOfPublication = responseJson.value;
            if(dateOfPublication != null) callback(dateOfPublication.toString());

            var publisherElement = $(responseText).find('#productDetailsTable div.content li:contains(' + SiteParser.Publisher + ')');
            dateOfPublication = ParseString(publisherElement.text(), '', '(', ')');

            callback(dateOfPublication);
        }
    });
}

function GetEstSale(salesRank)
{
    data = SiteParser.EstSalesScale;

    if (typeof salesRank === "undefined")
        return 1;

    var sale = salesRank.replace(SiteParser.ThousandSeparator, "");

    for (var i = 0; i < data.length; i++)
    {
        if (sale >= data[i].min && sale <= data[i].max)
        {
            return data[i].EstSale;
        }
    }

    return "0";
}

function GetPrice(price)
{
    if (typeof price === "undefined")
        return 1;

    if (price.indexOf("Free") >= 0)
        return 0;

    return SiteParser.ParsePrice(price);
}

function GetSalesRecv(estsales, realPrice)
{
    if (typeof estsales === "undefined")
        return 1 * price;

    return estsales * realPrice;
}

function GetPrintLength(responseText){
	return parseInt($(responseText).find('#pageCountAvailable span').text()).toString();
}

function fRun(num, url, price, parenturl, nextUrl, reviews, category, categoryKind)
{
    $.get(url, function(responseText){
        var entryUrl = url;
        var entryParentUrl = parenturl;
        var entryTitle = GetTitle(responseText);
        var entryPrice = price;
        var realPrice = SiteParser.ParsePrice(price);

        if (typeof entryPrice === "undefined" || entryPrice.length <= 1)
            return;

        var entrySalesRank = GetSalesRank(responseText);
        var entryEstSale = GetEstSale(entrySalesRank);
        var entrySalesRecv = GetSalesRecv(entryEstSale, realPrice);
        var entryPrintLength = GetPrintLength(responseText);
        var entryAuthor = GetAuthor(responseText);
        GetDateOfPublication(responseText, function(entryDateOfPublication){
            if(typeof reviews === "undefined") {
                var rl_reviews = $(responseText).find("#acr .acrCount a:first");
                reviews = rl_reviews.length? parseInt($(rl_reviews).text()).toString():"0";
            }

            if (typeof entryTitle === "undefined" || entryTitle === "")
            {
                entryTitle = GetAuthorTitle(responseText);
            }

            if (typeof entryTitle === "undefined")
                return;

            if (typeof entryPrice === "undefined")
                entryPrice = "0";

            if (typeof entryEstSale === "undefined")
                entryPrice = "0";

            if (typeof entrySalesRecv == "undefined")
                entrySalesRecv = "0";

            if (typeof reviews === "undefined")
                reviews = "0";

            if (typeof  entrySalesRank === "undefined" || entrySalesRank.length < 1)
                entrySalesRank = "1";

            if (typeof entryPrintLength === "undefined" || entryPrintLength =='' || entryPrintLength =="NaN")
                entryPrintLength = "n/a";

            if (typeof entryAuthor === "undefined" || entryAuthor.length < 1)
                entryAuthor = "n/a";

            chrome.runtime.sendMessage({type:"get-settings"}, function(response){
                if (response.settings.PullStatus) {
                    chrome.runtime.sendMessage({type: "save-settings", No: num, URL: entryUrl, ParentURL: entryParentUrl,
                        NextUrl: nextUrl, Title: entryTitle, Price: SiteParser.FormatPrice(realPrice), EstSales: entryEstSale,
                        SalesRecv: entrySalesRecv, Reviews: reviews, SalesRank: entrySalesRank,
                        Category:category, CategoryKind: categoryKind,
                        PrintLength:entryPrintLength, Author:entryAuthor, DateOfPublication:entryDateOfPublication});
                }
            });
        });
    });
}

function LoadBestSellersPage(pageNumber, delay){
    delay = ValueOrDefault(delay, 0);
    var pageUrl = ParentUrl + "?pg=" + pageNumber;
    setTimeout(LoadBestSellersUrl.bind(null, pageUrl, ParentUrl, false), delay);
}

function LoadSearchResultsPage(pageNumber, delay){
    delay = ValueOrDefault(delay, 0);
    var search = GetParameterByName(ParentUrl, "field-keywords");
    var startIndex = (pageNumber-1) * 20;
    var endIndex = startIndex + 19;
    var startIndexPage = Math.floor(startIndex/SiteParser.SearchResultsNumber) + 1;
    var endIndexPage = Math.floor(endIndex/SiteParser.SearchResultsNumber) + 1;
    setTimeout(LoadSearchPage.bind(null, (ParentUrl + "&page="+startIndexPage).trim(), ParentUrl, startIndex, endIndex+1, search), delay);

    if(startIndexPage != endIndexPage){
        setTimeout(LoadSearchPage.bind(null, (ParentUrl + "&page="+endIndexPage).trim(), ParentUrl, startIndexPage*SiteParser.SearchResultsNumber, endIndex+1, search), delay + 1000);
    }
}

var AuthorPager;
function LoadAuthorResultPage(callback){
    var itemsPerPage = SiteParser.AuthorResultsNumber;

    if(AuthorPager === undefined) {
        AuthorPager = new Pager(itemsPerPage);
    };

    AuthorPager.LoadNextPage(callback);
}
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var pageNumber = request.page;
        if(IsAuthorPage()){
            LoadAuthorResultPage();
        }
        else if (IsBestSellersPage(ParentUrl)){
            LoadBestSellersPage(pageNumber);
        }
        else if(IsSearchPage(ParentUrl)){
            LoadSearchResultsPage(pageNumber);
        }
    });



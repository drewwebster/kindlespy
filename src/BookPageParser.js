/**
 * Created by Andrey Klochkov on 12.10.2014.
 */

function BookPageParser(url){
    this._siteParser = GetSiteParser(url);
}

BookPageParser.prototype.GetDateOfPublication = function(responseText, callback) {
    var pubdate = $(responseText).find('#pubdate').val();
    if(pubdate === undefined){
        var publisherElement = $(responseText).find('#productDetailsTable div.content li:contains(' + SiteParser.Publisher + ')');
        var dateOfPublication = ParseString(publisherElement.text(), '', '(', ')');

        callback(dateOfPublication);
        return;
    }

    $.ajax({
        url: this._siteParser.MainUrl + "/gp/product/features/ebook-synopsis/formatDate.html",
        data: { datetime: pubdate },
        dataType: "json",
        success: function (responseJson) {
            var dateOfPublication = responseJson.value;
            if(dateOfPublication != null) callback(dateOfPublication.toString());
        }
    });
};

BookPageParser.prototype.GetAuthorTitle = function(responseText) {
    return ParseString(responseText, 'id="productTitle"', '>', '<');
};

BookPageParser.prototype.GetGoogleSearchUrlByTitleAndAuthor = function(title, author){
    var baseUrl = "http://google.com/";
    if((title=='undefined' || title.length<1) || (author=='undefined' || author.length<1)) return baseUrl;
    title = title.replace(/ /g, "+");
    author = author.replace(/ /g, "+");
    return baseUrl + "?q=" + title + "+" + author + "&oq=" + title + "+" + author + "#safe=off&q="+ title + "+" + author;
};

BookPageParser.prototype.GetGoogleImageSearchUrl = function(responseText, url, callback){
    var googleUrl = "https://www.google.com/";
    if (typeof responseText === "undefined" || responseText.length <= 1){
        callback(googleUrl);
        return;
    }
    this._siteParser.GetGoogleImageSearchUrlRel(responseText, url, function(rel){
        if (rel == 'undefined' || rel.length<1) callback(googleUrl);
        callback(googleUrl + "searchbyimage?hl=en&image_url=" + rel);
    });
};

BookPageParser.prototype.GetImageUrl = function(responseText){
    if (typeof responseText === "undefined" || responseText.length <= 1){
        return;
    }
    var src = this._siteParser.GetImageUrlSrc(responseText);
    if (src == 'undefined' || src.length<1) return;
    return src;
};

BookPageParser.prototype.GetTitle = function(responseText) {
    if (typeof responseText !== "undefined" && responseText.length > 1)
    {
        return this._siteParser.GetTitle(responseText);
    }
};

BookPageParser.prototype.GetReviews = function(responseText) {
    if (typeof responseText !== "undefined" && responseText.length > 1) {
        return this._siteParser.GetReviews(responseText);
    }
};

BookPageParser.prototype.GetPrice = function(responseText) {
    var priceBlock = $(responseText).find('#priceBlock b.priceLarge');
    if(priceBlock && priceBlock.text().trim() !== '') {
        if(priceBlock.text().trim() == "Free") return this._siteParser.FormatPrice("0.00");
         return priceBlock.text().trim();
    }
    priceBlock = $(responseText).find('#kindle_meta_binding_winner .price');
    return priceBlock ? priceBlock.text().trim() : "";
};

BookPageParser.prototype.GetSalesRank = function(responseText) {
    if (typeof responseText === "undefined" || responseText === "") return '0';

    var szPattern = this._siteParser.AmazonBestSellersPattern;
    var pos = responseText.indexOf(szPattern);

    if (typeof pos === "undefined" || pos < 0) return '0';

    var szSalesRank = responseText.substr(pos + szPattern.length);
    szPattern = '>';
    pos = szSalesRank.indexOf(szPattern);

    if (typeof pos === "undefined" || pos < 0) return "0";

    var szSalesRank = szSalesRank.substr(pos + szPattern.length);
    szSalesRank = szSalesRank.trim();
    var szTmp = szSalesRank.split(' ');
    for (var i = 0; i < szTmp.length; i++) {
        if (szTmp[i].indexOf('#') >= 0) {
            szSalesRank = szTmp[i].substr(szTmp[i].indexOf('#') + 1);
            return szSalesRank;
        }
    }

    return '0';
};

BookPageParser.prototype.GetEstSale = function(salesRank) {
    var data = this._siteParser.EstSalesScale;
    if (typeof salesRank === "undefined") return 1;
    var sale = salesRank.toString().replace(this._siteParser.ThousandSeparator, "");

    for (var i = 0; i < data.length; i++) {
        if (sale >= data[i].min && sale <= data[i].max) return data[i].EstSale;
    }

    return "0";
};

BookPageParser.prototype.GetSalesRecv = function(estsales, price) {
    if (typeof estsales === "undefined") return price;

    return estsales * price;
};

BookPageParser.prototype.GetPrintLength = function(responseText) {
    return parseInt($(responseText).find('#pageCountAvailable span').text()).toString();
};

BookPageParser.prototype.GetAuthor = function(responseText) {
    var tmpResponseText = ParseString(responseText, 'contributorNameTrigger', '>', '/a>');
    var author = ParseString(tmpResponseText, 'contributorNameTrigger', '>', '<');
    if ((author == '')||(author == 'undefined')){
        tmpResponseText = ParseString(responseText, "<div class=\"buying\">", 'parseasinTitle', "<span class=\"byLinePipe\">");
        author = ParseString(tmpResponseText , "<a", '>', '</a>');
    }

    return author;
};

BookPageParser.prototype.GetSalesRankFromUrl = function(url, callback) {
    var _this = this;

    $.get(url, function (responseText) {
        var salesRank = _this.GetSalesRank(responseText);
        if (!salesRank) salesRank = "1";
        callback(salesRank);
    });
};

BookPageParser.prototype.GetBookData = function(url, price, reviews, callback) {
    var _this = this;

    $.get(url, function (responseText) {
        var entryTitle = _this.GetTitle(responseText);
        if (typeof entryTitle === "undefined" || entryTitle === "") entryTitle = _this.GetAuthorTitle(responseText);
        if (typeof entryTitle === "undefined") return;
        if (!reviews) reviews = _this.GetReviews(responseText);
        if (!price) price = _this.GetPrice(responseText);

        var entrySalesRank = _this.GetSalesRank(responseText);
        var entryEstSale = _this.GetEstSale(entrySalesRank);
        var entryPrice = price;
        var realPrice = _this._siteParser.ParsePrice(price);
        var entrySalesRecv = _this.GetSalesRecv(entryEstSale, realPrice);
        var entryPrintLength = _this.GetPrintLength(responseText);
        var entryAuthor = _this.GetAuthor(responseText);
        var entryGoogleSearchUrl = _this.GetGoogleSearchUrlByTitleAndAuthor(entryTitle, entryAuthor);
        var entryImageUrl = _this.GetImageUrl(responseText);
        _this.GetGoogleImageSearchUrl(responseText, url, function (entryGoogleImageSearchUrl) {
            _this.GetDateOfPublication(responseText, function (entryDateOfPublication) {
                if (typeof entryPrice === "undefined") entryPrice = "0";
                if (typeof entryEstSale === "undefined") entryPrice = "0";
                if (typeof entrySalesRecv == "undefined") entrySalesRecv = "0";
                if (typeof reviews === "undefined") reviews = "0";
                if (typeof entrySalesRank === "undefined" || entrySalesRank.length < 1) entrySalesRank = "1";
                if (typeof entryPrintLength === "undefined" || entryPrintLength == '' || entryPrintLength == "NaN") entryPrintLength = "n/a";
                if (typeof entryAuthor === "undefined" || entryAuthor.length < 1) entryAuthor = "n/a";
                if (typeof entryImageUrl === "undefined")entryImageUrl = '';

                callback({
                    title: entryTitle,
                    price: _this._siteParser.FormatPrice(realPrice),
                    estSale: entryEstSale,
                    salesRecv: entrySalesRecv,
                    reviews: reviews,
                    salesRank: entrySalesRank,
                    printLength: entryPrintLength,
                    author: entryAuthor,
                    dateOfPublication: entryDateOfPublication,
                    googleSearchUrl: entryGoogleSearchUrl,
                    googleImageSearchUrl: entryGoogleImageSearchUrl,
                    imageUrl: entryImageUrl
                });
            });
        });
    });
};
/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonComParser(){
    this.mainUrl = "http://www.amazon." + AmazonComParser.zone;
    this.completionUrl = "http://completion.amazon." + AmazonComParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=1";
    this.region = AmazonComParser.region;
    this.areYouAnAuthorPattern = "Are You an Author";
    this.free = 'free';
    this.currencySign = "$";
    this.currencySignForExport = "$";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 12;
    this.publisher = "Publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 120000},
        {min: 6, max: 10, estSale: 105000},
        {min: 11, max: 20, estSale: 90000},
        {min: 21, max: 35, estSale: 75000},
        {min: 36, max: 100, estSale: 55000},
        {min: 101, max: 200, estSale: 30000},
        {min: 201, max: 350, estSale: 12000},
        {min: 351, max: 500, estSale: 6000},
        {min: 501, max: 750, estSale: 4500},
        {min: 751, max: 1500, estSale: 3300},
        {min: 1501, max: 3000, estSale: 2550},
        {min: 3001, max: 4000, estSale: 2100},
        {min: 4001, max: 5000, estSale: 1700},
        {min: 5001, max: 6000, estSale: 1500},
        {min: 6001, max: 7000, estSale: 1250},
        {min: 7001, max: 8000, estSale: 1000},
        {min: 8001, max: 9000, estSale: 750},
        {min: 9001, max: 10000, estSale: 600},
        {min: 10001, max: 12000, estSale: 430},
        {min: 12001, max: 15000, estSale: 350},
        {min: 15001, max: 17500, estSale: 310},
        {min: 17501, max: 20000, estSale: 285},
        {min: 20001, max: 25000, estSale: 245},
        {min: 25001, max: 30000, estSale: 200},
        {min: 30001, max: 35000, estSale: 140},
        {min: 35001, max: 50000, estSale: 110},
        {min: 50001, max: 65000, estSale: 50},
        {min: 65001, max: 80000, estSale: 25},
        {min: 80001, max: 100000, estSale: 15},
        {min: 100001, max: 200000, estSale: 4},
        {min: 200001, max: 500000, estSale: 2},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonComParser.zone = "com";
AmazonComParser.region = "USA";

AmazonComParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonComParser.prototype.getDescription = function(jqNodes){
    var description = jqNodes.find("#bookDescription_feature_div noscript");
    if (description.length > 0) return $(description.text()).text().trim();

    return jqNodes.find("#outer_postBodyPS").text().trim();
};

AmazonComParser.prototype.getKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find(".tp").find("tr").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
    });

    return retval;
};

AmazonComParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find(".tpType > a:first").attr("href");
};

AmazonComParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    var priceTag = kindleEditionRow.find(".toeOurPrice > a:first");
    if (priceTag.length > 0) return priceTag;
    return kindleEditionRow.find(".toeOurPriceWithRent > a:first");
};

AmazonComParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".reviewsCount > a:first").text();
};

AmazonComParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonComParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonComParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonComParser.prototype.getImageUrlSrc = function(responseText) {
    var imgBlkFront = responseText.find('#imgBlkFront');
    if (imgBlkFront.length > 0){
        return imgBlkFront.attr('data-src').trim();
    }

    return Helper.parseString(responseText.find('#holderMainImage noscript').text(),"src=","\"", "\" ");
};

AmazonComParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length > 0)
        return $(rl_reviews).text().trim();

    rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').trim() : "0";
};

AmazonComParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span");
    if (ratingString.length === 0)
        ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonComParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};

AmazonComParser.prototype.getPrintLength = function(jqNodes) {
    var link = jqNodes.find('#aboutEbooksSection span a:first');
    if (link.length > 0)
        return parseInt(link.text()).toString();

    var text = jqNodes.find('#productDetailsTable .content li:contains(Print Length)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }

    return null;
};

AmazonComParser.prototype.getAuthor = function(jqNodes) {
    var contributorNameId = jqNodes.find('#byline a.contributorNameID');
    if (contributorNameId.length > 0)
        return contributorNameId.text().trim();

    var link = jqNodes.find('#byline span.author a:first');
    if (link.length > 0)
        return link.text().trim();

    return null;
};

AmazonComParser.prototype.getPrice = function(jqNodes) {
    var priceNodes = $(jqNodes.find('#buybox .kindle-price td')[1]).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes === 'undefined' || priceNodes.length == 0) return null;
    return priceNodes[0].nodeValue.trim();
};
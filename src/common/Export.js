/**
 * Created by Andrey on 15.04.2015.
 */

function Export(){
}
Export.exportData = function(data, booksNumber, fileName){
    var csvContent = "\uFEFF";
    data.forEach(function(infoArray, index){
        if (index <= booksNumber)
        {
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

                if(i == 10 && index > 0)
                    fieldValue =  "=HYPERLINK(\"" + fieldValue + "\")";
                dataString[i] = (quotesRequired || escapeQuotes ? "\"" : "") + fieldValue + (quotesRequired || escapeQuotes ? "\"" : "") + ((i < (infoArray.length-1)) ? "," : "\r\n");
            }
            for (var i = 0; i < dataString.length; i ++)
                csvContent += dataString[i];
        }
    });

    var blob = new Blob([csvContent], {type : 'text/csv', charset : 'utf-8', encoding:'utf-8'});
    var url = URL.createObjectURL(blob);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName + "-" + mm + "-" + dd + "-" + yyyy + ".csv");
    link.click();
};
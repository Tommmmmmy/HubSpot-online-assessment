var HashMap = require('hashmap');
var map = new HashMap();

var request = require("request");
request("https://candidate.hubteam.com/candidateTest/v2/partners?userKey=161e38fec9aef1f89250353f2e9c", function(error, response, body){
    if(!error && response.statusCode == 200){
        var text = '{ "countries": [';
        var parsed = JSON.parse(body);
        var partners = parsed["partners"];
        for(var i = 0; i < partners.length; i++) {
            var country = partners[i]["country"];
            if(!map.has(country)) {
                map.set(country, new HashMap());
            }
            var email = partners[i]["email"];
            var dates = partners[i]["availableDates"];
            var allDates = new Set();
            for(var j = 0; j < dates.length; j++) {
                var array = dates[j].split("-");
                var newTime = array[1] + " " + array[2] + " " + array[0];
                var newDate = new Date(newTime);
                allDates.add(newDate.toDateString());
            }
            for (var item of allDates) {
                var startTime = new Date(item);
                var temp = new Date(startTime.getTime() + 86400000);
                var tempString = temp.toDateString();
                if(allDates.has(tempString)) {
                    var countryMap = map.get(country);
                    if(!countryMap.has(startTime.toISOString().substr(0, 10))) {
                        countryMap.set(startTime.toISOString().substr(0, 10), new Set());
                    }
                    countryMap.get(startTime.toISOString().substr(0, 10)).add(email);
                }
            }
        }
        map.forEach(function(value, key) {
            var country = key;
            var resTime;
            var maxSize = 0;
            value.forEach(function(value1, key1) {
                var time = key1;
                var size = value1.size;
                if(size > maxSize) {
                    resTime = time;
                    maxSize = size;
                }
                else if(size == maxSize) {
                    if(time < resTime) {
                        resTime = time;
                    }
                }
            });
            text += '{"attendeeCount": ' + maxSize + ',' + '"attendees": [';
            for(var guest of value.get(resTime)) {
                text += '"' + guest + '",'
            }
            text = text.substr(0, text.length - 1);
            text += '],';
            text += '"name": "' + country + '",' + '"startDate": '
            if(map.get(key).size == 0) {
                text += null;
            }
            else {
                text += '"' + resTime + '"},';
            }
        });
        text = text.substr(0, text.length - 1);
        text += ']}'
        var obj = JSON.parse(text);
        request({
            url: "https://candidate.hubteam.com/candidateTest/v2/results?userKey=161e38fec9aef1f89250353f2e9c",
            method: "POST",
            json: true,   // <--Very important!!!
            body: obj
            }, function (error, response, body){
                console.log(response);
        });
    }
});
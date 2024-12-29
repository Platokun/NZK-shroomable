
const Date_Holidays = require('date-holidays');
//save to file
const fs = require('fs');
var hd;
const countryCodes = [
    "AD","AE","AG","AI","AL","AM","AO","AR","AS","AT","AU","AW","AX","AZ","BA",
    "BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS",
    "BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO",
    "CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE",
    "EG","EH","ER","ES","ET","FI","FJ","FO","FR","GA","GB","GD","GE","GF","GG",
    "GH","GI","GL","GM","GN","GP","GQ","GR","GT","GU","GW","GY","HK","HN","HR",
    "HT","HU","IC","ID","IE","IL","IM","IR","IS","IT","JE","JM","JP","KE","KM",
    "KN","KR","KY","LC","LI","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME",
    "MF","MG","MK","ML","MQ","MR","MS","MT","MW","MX","MY","MZ","NA","NC","NE",
    "NG","NI","NL","NO","NZ","PA","PE","PH","PL","PM","PR","PT","PY","RE","RO",
    "RS","RU","RW","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO",
    "SR","SS","ST","SV","SX","SZ","TC","TD","TG","TH","TN","TO","TR","TT","TW",
    "TZ","UA","UG","US","UY","VA","VC","VE","VG","VI","VN","VU","XK","YT","ZA",
    "ZM","ZW"
  ];
var i = 0;  
var code;
var all_holidays = [];
// Loop through all the countries
for (i = 0; i < countryCodes.length; i++) {
    code = countryCodes[i];
    hd = new Date_Holidays(code);
    const all_found_holidays = hd.getHolidays(2024);
    //console.log(all_found_holidays);
    all_holidays.push(all_found_holidays);
}

function saveToFile(data) {
    fs.writeFile('all_found_holidays.json', JSON.stringify(data), (err) => {
        if (err) {
            console.warn('Error writing file:', err);
        } else {
            //console.log('Successfully wrote file');
        }
    });
}
var number_of_days_in_a_year = 365;
var are_we_a_leap_year = false;
const is_leap_year = function(year) {
    if (year % 4 === 0) {
        if (year % 100 === 0) {
            if (year % 400 === 0) {
                return true;
            }
            return false;
        }
        return true;
    }
    return false;
}
var days_in_a_month = [31,28,31,30,31,30,31,31,30,31,30,31];
var name_of_month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var month = 0;
var all_found_holidays = [];
if (is_leap_year(2024)) {
    are_we_a_leap_year = true;
    number_of_days_in_a_year = 366; 
    days_in_a_month[1] = 29;
}
else {
    are_we_a_leap_year = false;
    number_of_days_in_a_year = 365;
    days_in_a_month[1] = 28;
}
//console.log(are_we_a_leap_year);
//console.log(number_of_days_in_a_year);
// fill all_found_holidays with "none" for each day of the year
for (i = 0; i < number_of_days_in_a_year; i++) {
    all_found_holidays.push("none");
}

/*  {
    date: '2024-06-16 00:00:00',
    start: 2024-06-15T22:00:00.000Z,
    end: 2024-06-16T22:00:00.000Z,
    name: "Father's Day",
    type: 'observance',
    rule: '3rd sunday in June'
  }*/
 // in all_holidays we have to parse each json {"date":"2024-05-20 00:00:00","start":"2024-05-19T22:00:00.000Z","end":"2024-05-20T22:00:00.000Z","name":"Lunes de Pentecostés","type":"public","rule":"easter 50"} 
// ignore each time and the year and get the month and the day
// then set that day of the year of the index of all_found_holidays the name of  the holiday
// for example all_found_holidays[for i in (days_in_a_month) untill month = + days_in_a_month + [i]]
function mapHolidaysToDays(allHolidays, all_found_holidays, daysInMonth) {
    // Loop through all the countries' all_found_holidays
    allHolidays.forEach(countryHolidays => {
        countryHolidays.forEach(holiday => {
            // Parse the date and extract the month and day
            const date = new Date(holiday.date);
            const month = date.getMonth(); // 0-based month
            const day = date.getDate(); // 1-based day
            
            // Calculate the day of the year
            let dayOfYear = day;
            for (let i = 0; i < month; i++) {
                dayOfYear += daysInMonth[i];
            }
            
            // Assign the holiday name to the corresponding index in the all_found_holidays array
            if (all_found_holidays[dayOfYear - 1] === "none") {
                all_found_holidays[dayOfYear - 1] = holiday.name;
            } else {
                all_found_holidays[dayOfYear - 1] += `, ${holiday.name}`;
            }
        });
    });

    //console.log("Mapped all_found_holidays to days of the year.");
}

// Call the function
mapHolidaysToDays(all_holidays, all_found_holidays, days_in_a_month);

function what_days_dont_have_holidays(all_found_holidays) {
    var days_without_holidays = [];
    for (i = 0; i < all_found_holidays.length; i++) {
        if (all_found_holidays[i] === "none") {
            days_without_holidays.push(i);
        }
    }
    return days_without_holidays;
}
// Save the mapped all_found_holidays array to a file
saveToFile(all_found_holidays);
var days_without_holidays = what_days_dont_have_holidays(all_found_holidays);
/*
it will look something like
[
   29,  30,  50,  56,  59,  75,
   95, 110, 131, 192, 212, 247,
  248, 256, 269, 289, 295, 303,
  312, 330, 331, 337, 363
]
  so we need to find the month and the day of the month
*/
find_month_and_day = function(days_without_holidays) {
    var month_and_day = [];
    for (i = 0; i < days_without_holidays.length; i++) {
        var day = days_without_holidays[i];
        var month = 0;
        while (day > days_in_a_month[month]) {
            day -= days_in_a_month[month];
            month++;
        }
        month_and_day.push([name_of_month[month], day]);
    }
    return month_and_day;
}
console.log("days without all_found_holidays: in js library ",find_month_and_day(days_without_holidays));
var include_holidays_from_js_library = true;
var what_day_is_today = function() {
    var today = new Date();
    var month = today.getMonth();
    var day = today.getDate();
    // figure out what number day of the year it is
    var day_of_the_year = day;
    for (i = 0; i < month; i++) {
        day_of_the_year += days_in_a_month[i];
    }
    day_of_the_year -= 2;
    var todays_holiday = all_found_holidays[day_of_the_year];
    //sort todays_holiday alphanumarically
    todays_holiday = todays_holiday.split(',').sort().join(', ');
//if day ends in 1 and is not 11, then use "st"
//if day ends in 2 and is not 12, then use "nd"
//if day ends in 3 and is not 13, then use "rd"
//else use "th"
var day = day.toString();
if (day.endsWith("1") && !day.endsWith("11")) {
    day += "st";
}
else if (day.endsWith("2") && !day.endsWith("12")) {
    day += "nd";
}
else if (day.endsWith("3") && !day.endsWith("13")) {
    day += "rd";
}
else {
    day += "th";
}
day_of_the_year = day_of_the_year.toString();
if (day_of_the_year.endsWith("1") && !day_of_the_year.endsWith("11")) {
    day_of_the_year += "st";
}
else if (day.endsWith("2") && !day_of_the_year.endsWith("12")) {
    day_of_the_year += "nd";
}
else if (day.endsWith("3") && !day_of_the_year.endsWith("13")) {
    day_of_the_year += "rd";
}
else {
    day_of_the_year += "th";
}
if (todays_holiday == "none") {
var a = "today is "+name_of_month[month] + " the " + day + ", the " + day_of_the_year + " day of the year \n the js library has not found any holidays \n";
    todays_holiday = "there is no holiday today";
    include_holidays_from_js_library = false;
    console.log( a , todays_holiday);    

}
else {
var a = "today is "+name_of_month[month] + " the " + day + ", the " + day_of_the_year + " day of the year \n todays found holidays are \n";
include_holidays_from_js_library = true;
console.log( a , todays_holiday);    

}

}
what_day_is_today();

//idfky its giving the wrong days

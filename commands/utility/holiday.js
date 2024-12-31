// this file is named ping.js and it is located in path: */bot/commands/ at */bot/commands/ping.js
var { SlashCommandBuilder } = require('discord.js'); //#ignore type
var holidays;
var holiday;
var match;
var holidayLines;
var response;
var url;
var html;
var lines;
var regex;
var message;
async function fetchAndParseHolidays() {
    url = 'https://nationaltoday.com/today/';
    try {
        // Fetch the HTML content
        response = await fetch(url);
         html = await response.text();
        // Split HTML into lines
         lines = html.split('\n');
        // Filter lines containing 'holiday-title'
        holidayLines = lines.filter(line => line.includes('holiday-title'));

        // Extract the content inside the tags
         regex = />\s*(.*?)\s*</;
        holidays = holidayLines.map(line => {
            match = regex.exec(line);
            return match ? match[1] : null; // Return the captured group or null
        }).filter(Boolean); // Remove null entries

        // Remove entries that include 'Birthday'
        for (let i = 0; i < holidays.length; i++) {
            if (holidays[i].includes('Birthday')) {
                holidays.splice(i, 1);
                i--;
            }
        }
        return holidays;
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        return [];
    }
}
function number_to_th(number){
    number = number.toString();
    if (number == 1 && number != 11){
        return number + "st";
    }
    else if (number == 2 && number != 12){
        return number + "nd";
    }
    else if (number == 3 && number != 13){
        return number + "rd";
    }
    else{
        return number + "th";
    }

}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('holiday')
        .setDescription('replies with todays holidays'),
    async execute(interaction) {

        
        // Usage example
        fetchAndParseHolidays().then(holidays => {
            //sort todays_holiday alphanumarically
            holidays = holidays.sort();
            console.log('Holidaysaaaa:', holidays);
            // get array length of holidays
            var length = holidays.length;
            
            var today = new Date();
            var day = number_to_th(today.getDate());
            var month = number_to_th(today.getMonth() + 1);
            var year = today.getFullYear();
            
            message = `today is the ${month} month on the ${day} day of the year ${year} and todays holidays are:\n `;
            //then do for (iterations) "holiday[i] \n"
            for (var i = 0; i < length; i++) {message = message + holidays[i] + "\n";}
            console.log(message);
            interaction.reply(message);
        });
        
        
        
    },
};
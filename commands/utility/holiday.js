var { SlashCommandBuilder } = require('discord.js'); 
var holidays;var holiday; var holidayLines;
var match; var response; var url; var html;
var lines; var regex; 
var not_true = true; 
var waiting = 0; 
var message;
async function fetchAndParseHolidays() {
    url = 'https:/* nationaltoday.com/today/';
    not_true = true;
    try {
        /*  Fetch the HTML content */
        response = await fetch(url);
        html = await response.text();

        /*  Split HTML into lines */
        lines = html.split('\n');

        /*  Filter lines containing 'holiday-title' */
        holidayLines = lines.filter(line => line.includes('holiday-title'));

        /*  Extract the content inside the tags */
        regex = />\s*(.*?)\s*</;
        holidays = holidayLines.map(line => {match = regex.exec(line); return match ? match[1] : null; /* tl;dr parse the html so it only includes the data within the tags that are used for today's holiday group or null */ }).filter(Boolean); /* Remove null entries*/
        /* Remove entries that include 'Birthday'*/
        for (let i = 0; i < holidays.length; i++) {if (holidays[i].includes('Birthday')) {holidays.splice(i, 1); i--;} }
        not_true = false; return holidays;
    } catch (error) { not_true = false; console.error('Error fetching or parsing data:', error); return [];}
}
function number_to_th(number) {
    number = number.toString();
         if (number == 1 && number != 11) {return number + "st";}
    else if (number == 2 && number != 12) {return number + "nd";} 
    else if (number == 3 && number != 13) {return number + "rd";} 
    else /* if should end in th lmfao*/   {return number + "th";}
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('holiday')
        .setDescription('replies with todays holidays and the date'),
    async execute(interaction) {
        fetchAndParseHolidays().then(holidays => { /*  Sort holidays alphabetically */
            holidays = holidays.sort(); console.log('Holidays:', holidays);
            while (not_true) { waiting++; console.log("waiting:", waiting); /*  Sleep for a quarter of a second */ }
            var length = holidays.length;
            var today = new Date(); 
            var day = number_to_th(today.getDate());
            var month = number_to_th(today.getMonth() + 1); /*  we hate thinking in base 1 but using base 0 lmfao */
            var year = today.getFullYear();
            /*  Create the message */
            message = `Today is the ${month} month on the ${day} day of the year ${year} and today's holidays are:\n`;
            for (var i = 0; i < length; i++) { message = message + holidays[i] + "\n";}
            console.log(message);
            interaction.reply(message); /*  Send the message to discord server where we did the faqing slash command */
        });
    },
};

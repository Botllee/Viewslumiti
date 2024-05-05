const CFonts = require('cfonts');

const displayBanner = () => {
    CFonts.say('AutoViewStatus', {
        font: 'chrome',
        align: 'center',
        gradient: ['red', 'magenta']
    });
};

module.exports = displayBanner;
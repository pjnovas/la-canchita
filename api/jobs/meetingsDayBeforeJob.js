var moment = require('moment');

module.exports = function(agenda) {
  return {
    name: 'meetingsDayBefore',
    disabled: false,
    frequency: 'every 30 seconds',  // every day at 16:00

    run: function(job, done) {
      console.log("[meetingsDayBefore] Executed");

      var today = moment().startOf('day');
      var tomorrow = moment(today).add(1, 'days');
      var pastTomorrow = moment(today).add(2, 'days');

      Meeting
        .find({
          tomorrowNotified: false, // has not being notified for confirmation
          cancelled: false, // was not cancelled
          when: { $gte: tomorrow.toDate(), $lt: pastTomorrow.toDate() } // is tomorrow
        })
        .exec(function(err, meetings){
          if (err) {
            console.log('[meetingsDayBefore] ERROR on fetch Meetings');
            return console.dir(err);
          }

          var toNotify = meetings.map(function(meeting){
            return meeting.id;
          });

          if (toNotify.length > 0){
            sails.services.notifications.meetingsDayBefore(toNotify);
          }

          console.log('[meetingsDayBefore] End - Notified ' + toNotify.length);
          done();
        });
    },
  };
}

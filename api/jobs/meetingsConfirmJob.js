var moment = require('moment');

module.exports = function(agenda) {
  return {
    name: 'meetingsConfirm',
    disabled: false,
    frequency: 'every 30 seconds', // every 1 hour

    run: function(job, done) {
      console.log("[meetingsConfirm] Executed");

      var now = new Date();

      Meeting
        .find({
          confirmNotified: false, // has not being notified for confirmation
          cancelled: false, // was not cancelled
          confirmation: true, // has confirmation
          when: { $gte: now } // is in the future
        })
        .exec(function(err, meetings){
          if (err) {
            console.log('[meetingsConfirm] ERROR on fetch Meetings');
            return console.dir(err);
          }

          var toNotify = [];
          meetings.forEach(function(meeting){

            var cStart = null;
            var cEnd = null;
            var mStart = meeting.confirmStart;
            var mEnd = meeting.confirmEnd;

            if (mStart && mStart.times && mStart.period){
              cStart = moment(meeting.when).subtract(mStart.times, mStart.period);
            }

            if (mEnd && mEnd.times && mEnd.period){
              cEnd = moment(meeting.when).subtract(mEnd.times, mEnd.period);
            }

            if (
              cStart && cStart.isValid() && now > cStart &&
              cEnd && cEnd.isValid() && now < cEnd
            ){
              toNotify.push(meeting.id);
            }

          });

          if (toNotify.length > 0){
            sails.services.notifications.meetingsConfirmState(toNotify);
          }

          console.log('[meetingsConfirm] End - Notified ' + toNotify.length);
          done();
        });
    },
  };
}

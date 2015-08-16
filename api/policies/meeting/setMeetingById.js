/**
 * setMeetingById
 *
 * @module      :: Policy
 * @description :: Set Meeting by id to req.requestedMeeting
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  Meeting
    .findOne({ id: req.params.meetingId })
    .populateAll()
    .exec(function(err, meeting){
      if (err) return next(err);

      if (!meeting){
        return res.notFound('Requested meeting was not found');
      }

      req.group = meeting.group;
      req.requestedMeeting = meeting;

      next();
    });

};

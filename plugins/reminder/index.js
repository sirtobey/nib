var Command = require('../../lib/commands').Command
  , fs      = require('fs')

module.exports = Command.extend({
    name: 'remind'
  , info: 'Sets reminders for users.'
  , description: 'Sets reminders for users and reminds them on '
                +'the given date.'
  , init: function(bot) {
    this.readReminders()
    this.intervalTime = 1000 * 5 // TODO fix interval
    this.bot = bot

    var self = this

    this.interval = setInterval(function() {
      var now = new Date

      console.log(this)
      self._notes.forEach(function(note, index, all) {
        if (now > new Date(note.date)) {
          console.log('in interval')
          self.bot.notice(note.from, note.text)
          delete self._notes.note
          // TODO fix this
        }
      })
    }, this.intervalTime)
  }
  , cleanup: function(bot) {
    clearInterval(this.interval)
  }
  , handler: function(from, to, message) {
    if (!message) {
      return this._bot.notice(from, 'No message given!')
    }

    var self    = this
      , bot     = self._bot
      , split   = message.split(' ')
      , datestr = split[0]
      , timestr = split[1]
      , text    = split[2] ? message.slice(timestr.length + datestr.length + 2) : message.slice(datestr.length + 1)
      , datergx = /\d{1,2}\.\d{1,2}\.\d{4}/
      , timergx = /\d{1,2}\:\d{2}/

    if (!timestr.length) {
      return bot.notice(from, 'No text or date given!')
    }

    if (!text.length) {
      text = split[1]
    }

    var found = datestr.match(datergx)
    if (!found) {
      return bot.notice(from, 'Invalid date! Use dd.mm.yyyy!')
    }
    var datesplit = datestr.split('.')
      , day       = datesplit[0]
      , month     = datesplit[1] - 1
      , year      = datesplit[2]
      , hours     = 0
      , minutes   = 0

    found = timestr.match(timergx)
    console.log(found)
    if (found) {
      var timesplit = found[0].split(':')
      hours   = timesplit[0]
      minutes = timesplit[1]
    }

    var date = new Date(year, month, day, hours, minutes)
      , reminder = {
          'date' : date
        , 'from' : from
        , 'text' : text
      }

    if (this._notes) {
      this._notes.push(reminder)
    }
    else {
      this._notes = [reminder]
    }

    this.saveReminder()

    bot.notice(from, 'Added reminder: \"' + text + '\" on: ' + date)
  }
  , saveReminder: function(cb) {
    var filename = this._bot.file('reminders.json')

    fs.writeFile(filename, JSON.stringify(this._notes), function(err) {
      if (err) return cb(err)

      console.log('saved notes to: ', filename)

      if (typeof cb == 'function') cb()
    })
  }
  , readReminders: function() {
    var filename = this._bot.file('reminders.json')

    try {
      fs.statSync(filename)

      this._notes = JSON.parse(fs.readFileSync(filename))
    }
    catch (e) {
      console.error(e)
      this._notes = []
    }
  }
})


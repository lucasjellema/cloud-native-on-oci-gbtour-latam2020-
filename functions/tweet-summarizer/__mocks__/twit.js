const Twitter = function (config) { }

let getCallCounter =0;

Twitter.prototype.get = jest.fn(function (path, params, callback) {
    getCallCounter++
    const data = { "statuses": [] }
    callback(null, data, null)
})

Twitter.prototype.getCallCount = function () {return getCallCounter}

module.exports = Twitter;


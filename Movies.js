var mongoose = require('mongoose');
var Schema = mongoose.Schema;

try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    //console.log(error);
    console.log("could not connect");
}
// Movie schema
var MovieSchema = new Schema({
    title : {
        type: String,
        required: true,
        index: { unique: true }
    },
    releaseDate: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    actors: {
        type: Array,
        items: {
          type: Object,
          properties: {
            actorName: {
              type: String,
              required: true
            },
            characterName: {
                type: String,
                required: true
            }
          }
        }
    }
});

// MovieSchema.pre('save', function (next) {
//     var self = this;
//     data.find({
//       title: self.title
//     }, function (err, movie) {
//       if (!movie.length) {
//           next();
//        } else {
//            console.log('movie already exists');
//            next(new Error("Movie Already Exists"));
//        }
//     });
//  });

module.exports = mongoose.model('MOVIES', MovieSchema);